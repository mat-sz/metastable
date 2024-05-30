import { ConfigType } from '@metastable/types';
import { assign } from 'radash';

import { JSONFile } from '../helpers/fs.js';

const CONFIG_DEFAULTS: ConfigType = {
  python: {
    configured: false,
    mode: 'system',
  },
  generation: {
    preview: true,
    imageMetadata: true,
  },
  ui: {
    fuzzySearch: true,
  },
  app: {
    autoUpdate: true,
  },
};

export class Config {
  private configFile;

  constructor(configPath: string) {
    this.configFile = new JSONFile<ConfigType>(configPath, CONFIG_DEFAULTS);
  }

  async all(): Promise<ConfigType> {
    const data = await this.configFile.readJson();

    return assign({ ...CONFIG_DEFAULTS }, { ...data });
  }

  async store(config: ConfigType): Promise<void> {
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
}
