import { JSONFile } from '../helpers/fs.js';

interface ConfigType {
  python: {
    configured: boolean;
    mode: 'system' | 'static';
    pythonHome?: string;
    packagesDir?: string;
  };
  comfy?: {
    args?: string[];
    env?: Record<string, string>;
  };
  civitai?: {
    apiKey?: string;
  };
}

const CONFIG_DEFAULTS: ConfigType = {
  python: {
    configured: false,
    mode: 'system',
  },
};

export class Config {
  private configFile;

  constructor(configPath: string) {
    this.configFile = new JSONFile<ConfigType>(configPath, CONFIG_DEFAULTS);
  }

  async all(): Promise<ConfigType> {
    const data = await this.configFile.readJson();

    return {
      ...CONFIG_DEFAULTS,
      ...data,
    };
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
    await this.configFile.writeJson({ ...all, [key]: value });
  }
}
