import EventEmitter from 'events';

import { JSONFile } from '@metastable/common/fs';
import { ConfigType } from '@metastable/types';
import { assign } from 'radash';

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
    defaultPrompt: {
      positive: 'an image of a banana',
      negative: 'bad quality',
    },
  },
  ui: {
    fuzzySearch: true,
    notifications: false,
    theme: 'dark',
    fontSize: 16,
    units: {
      temperature: 'C',
    },
  },
  app: {
    autoUpdate: true,
    hideWelcome: false,
  },
  downloader: {
    apiKeys: {},
  },
  styles: [],
  modelFolders: {},
};

type ConfigEvents = {
  change: [];
};

export class Config extends EventEmitter<ConfigEvents> {
  private configFile;

  constructor(configPath: string) {
    super();
    this.configFile = new JSONFile<Partial<ConfigType>>(
      configPath,
      CONFIG_DEFAULTS,
    );
  }

  private upgrade(config: any): ConfigType {
    if (config.civitai?.apiKey) {
      if (!config.downloader.apiKeys['civitai']) {
        config.downloader.apiKeys['civitai'] = config.civitai?.apiKey;
      }

      delete config['civitai'];
    }

    if (config.huggingface?.apiKey) {
      if (!config.downloader.apiKeys['huggingface']) {
        config.downloader.apiKeys['huggingface'] = config.huggingface?.apiKey;
      }

      delete config['huggingface'];
    }

    if (config.styles.length) {
      config.styles = config.styles.map((item: any) => {
        if (!item.nodeType) {
          item.nodeType = 'item';
        }

        return item;
      });
    }

    return config;
  }

  async all(): Promise<ConfigType> {
    const data = await this.configFile.readJson();
    const config = assign({ ...CONFIG_DEFAULTS }, data);
    return this.upgrade(config);
  }

  async store(config: Partial<ConfigType>): Promise<void> {
    this.emit('change');
    await this.configFile.writeJson(config);
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
