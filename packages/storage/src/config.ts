import { JSONFile } from './helpers.js';

type ConfigType = Record<string, any>;

export class Config {
  configFile;

  constructor(configPath: string) {
    this.configFile = new JSONFile<Record<string, any>>(configPath, {});
  }

  async all(): Promise<ConfigType> {
    return await this.configFile.readJson();
  }

  async get(key: string, fallback?: any): Promise<any> {
    const all = await this.all();
    return all[key] ?? fallback;
  }

  async set(key: string, value: any): Promise<void> {
    const all = await this.all();
    await this.configFile.writeJson({ ...all, [key]: value });
  }
}
