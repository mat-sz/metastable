import fs from 'fs/promises';

export class TextFile {
  constructor(protected path: string) {}

  async read(): Promise<string | undefined> {
    try {
      return await fs.readFile(this.path, { encoding: 'utf-8' });
    } catch {
      return undefined;
    }
  }

  async write(data: string) {
    await fs.writeFile(this.path, data);
  }
}

export class JSONFile<T> extends TextFile {
  constructor(
    path: string,
    private fallback: T,
  ) {
    super(path);
  }

  async readJson(): Promise<T> {
    const data = await this.read();
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        //
      }
    }

    return this.fallback;
  }

  async writeJson(data: T) {
    await this.write(JSON.stringify(data));
  }
}
