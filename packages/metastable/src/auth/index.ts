import crypto from 'crypto';

import { JSONFile } from '@metastable/common/fs';
import { InstanceAuth } from '@metastable/types';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { nanoid } from 'nanoid';
import { assign } from 'radash';

import * as scrypt from './scrypt.js';

const AUTH_DEFAULTS = {
  enabled: false,
  accounts: [],
};

export class Auth {
  private configFile;

  constructor(configPath?: string) {
    if (configPath) {
      this.configFile = new JSONFile<InstanceAuth>(configPath, {
        enabled: false,
        accounts: [],
      });
    }
  }

  check() {
    if (!this.available) {
      throw new Error('Authentication not available.');
    }
  }

  async all() {
    this.check();
    const data = await this.configFile!.readJson();
    return assign({ ...AUTH_DEFAULTS }, data);
  }

  async get() {
    const all = await this.all();

    return {
      enabled: all.enabled,
      accounts: all.accounts.map(account => ({
        id: account.id,
        username: account.username,
      })),
    };
  }

  async setEnabled(value: boolean) {
    const data = await this.all();
    data.enabled = value;
    await this.store(data);
  }

  store(data: InstanceAuth) {
    this.check();
    return this.configFile!.writeJson(data);
  }

  async create(username: string, password: string) {
    username = username.trim();
    password = password.trim();
    if (!username || !password) {
      throw new Error('Username and password must not be empty.');
    }

    const data = await this.all();
    if (!data.enabled) {
      data.enabled = true;
    }

    if (data.accounts.find(account => account.username === username)) {
      throw new Error(`An account with username '${username}' already exists.`);
    }

    data.accounts.push({
      id: nanoid(),
      username,
      password: await scrypt.hash(password),
    });
    await this.store(data);
  }

  async update(username: string, password: string) {
    const data = await this.all();
    const account = data.accounts.find(
      account => account.username === username,
    );

    if (account) {
      account.password = await scrypt.hash(password);
    }

    await this.store(data);
  }

  async delete(username: string) {
    const data = await this.all();
    data.accounts = data.accounts.filter(
      account => account.username !== username,
    );
    if (!data.accounts.length) {
      data.enabled = false;
    }
    await this.store(data);
  }

  async authenticate(username: string, password: string) {
    const data = await this.all();
    const account = data.accounts.find(
      account => account.username === username,
    );

    if (!account || !(await scrypt.verify(password, account.password))) {
      throw new Error('Invalid username or password.');
    }

    if (!data.secret) {
      data.secret = crypto.randomBytes(32).toString('base64');
      await this.store(data);
    }

    const token = await new EncryptJWT({ id: account.id })
      .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
      .setIssuedAt()
      .setIssuer('urn:metastable')
      .setExpirationTime('2h')
      .encrypt(Buffer.from(data.secret, 'base64'));

    return { account, token };
  }

  async validateToken(token: string) {
    const data = await this.all();
    if (!data.secret) {
      throw new Error('Secret not found.');
    }

    const { payload } = await jwtDecrypt(
      token,
      Buffer.from(data.secret, 'base64'),
      {
        issuer: 'urn:metastable',
      },
    );
    if (!payload.id) {
      throw new Error('Invalid token.');
    }

    const account = data.accounts.find(account => account.id === payload.id);
    if (!account) {
      throw new Error('Account not fonud.');
    }

    return account;
  }

  get available() {
    return !!this.configFile;
  }

  async isEnabled() {
    if (!this.available) {
      return false;
    }

    const data = await this.all();
    return data.enabled && !!data.accounts.length;
  }
}
