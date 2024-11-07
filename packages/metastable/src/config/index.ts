import { ConfigType } from '@metastable/types';
import { assign } from 'radash';

import { JSONFile } from '../helpers/fs.js';

const CONFIG_DEFAULTS: ConfigType = {
  python: {
    configured: false,
    mode: 'system',
    features: {},
  },
  generation: {
    preview: true,
    imageMetadata: true,
    memoryWarnings: true,
  },
  ui: {
    fuzzySearch: true,
    notifications: false,
  },
  app: {
    autoUpdate: true,
    hideWelcome: false,
  },
  styles: [],
  modelFolders: {},
};

export class Config {
  private configFile;

  constructor(configPath: string) {
    this.configFile = new JSONFile<Partial<ConfigType>>(
      configPath,
      CONFIG_DEFAULTS,
    );
  }

  async all(): Promise<ConfigType> {
    const data = await this.configFile.readJson();
    return assign({ ...CONFIG_DEFAULTS }, { ...data }) as ConfigType;
  }

  async store(config: Partial<ConfigType>): Promise<void> {
    await this.configFile.writeJson({ ...config });
  }

  async get<TKey extends keyof ConfigType>(
    key: TKey,
  ): Promise<ConfigType[TKey]> {
    const all = await this.all();
    return all[key];
  }

  async set<TKey extends keyof ConfigType>(
    key: TKey,
    value: ConfigType[TKey],
  ): Promise<void> {
    const all = await this.all();
    await this.store({ ...all, [key]: value });
  }

  async reset(key?: keyof ConfigType) {
    if (!key) {
      await this.store({});
    } else {
      const data = await this.configFile.readJson();
      delete data[key];
      await this.store({ ...data });
    }
  }

  async resetExceptFor(key: keyof ConfigType) {
    const data = await this.configFile.readJson();
    await this.store({ [key]: data[key] });
  }
}
