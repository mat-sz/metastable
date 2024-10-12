import EventEmitter from 'events';
import { mkdir, stat, writeFile } from 'fs/promises';
import path from 'path';

import { getModelDetails } from '@metastable/model-info';
import { ImageInfo, Model, ModelDetails, ModelType } from '@metastable/types';
import chokidar from 'chokidar';

import { FileEntity } from './common.js';
import {
  CONFIG_EXTENSIONS,
  exists,
  IMAGE_EXTENSIONS,
  removeFileExtension,
  testExtensions,
  tryUnlink,
  walk,
} from '../helpers/fs.js';
import { generateThumbnail, getThumbnailPath } from '../helpers/image.js';
import { getStaticUrl } from '../helpers/url.js';
import { TypedEventEmitter } from '../types.js';

const MODEL_EXTENSIONS = [
  'ckpt',
  'pt',
  'bin',
  'pth',
  'safetensors',
  'onnx',
  'st',
  'sft',
];

export class ModelEntity extends FileEntity {
  type: ModelType | undefined = undefined;
  imageName: string | undefined = undefined;
  configName: string | undefined = undefined;
  simpleName: string;
  modelBaseDir: string | undefined = undefined;
  details: ModelDetails | undefined = undefined;

  constructor(_path: string) {
    super(_path);
    this.simpleName = removeFileExtension(this.name);
  }

  async load(): Promise<void> {
    const split = this.name.split('.');
    if (
      split.length < 2 ||
      !MODEL_EXTENSIONS.includes(split[split.length - 1])
    ) {
      throw new Error('Not a valid model file.');
    }

    await this.metadata.refresh();

    this.imageName = await testExtensions(
      this.metadataPath,
      this.name,
      IMAGE_EXTENSIONS,
    );
    this.configName = await testExtensions(
      this.baseDir,
      this.name,
      CONFIG_EXTENSIONS,
    );

    const imagePath = this.imagePath;
    if (imagePath) {
      await generateThumbnail(imagePath);
    }

    if (
      this.type === ModelType.CHECKPOINT ||
      this.type === ModelType.LORA ||
      this.type === ModelType.CONTROLNET ||
      this.type === ModelType.UNET
    ) {
      try {
        this.details = await getModelDetails(this.path);
      } catch (e) {
        console.warn(`Unable to get details from ${this.path} - ${e}`);
        this.details = {
          corrupt: true,
        };
      }
    }
  }

  get configPath() {
    if (!this.configName) {
      return undefined;
    }

    return path.join(this.baseDir, this.configName);
  }

  get imagePath() {
    if (!this.imageName) {
      return undefined;
    }

    return path.join(this.metadataPath, this.imageName);
  }

  get thumbnailPath() {
    if (!this.imagePath) {
      return undefined;
    }

    return getThumbnailPath(this.imagePath);
  }

  get image(): ImageInfo | undefined {
    if (this.imageName) {
      return {
        url: getStaticUrl(this.imagePath!),
        thumbnailUrl: getStaticUrl(this.thumbnailPath!),
      };
    }

    return undefined;
  }

  async delete(): Promise<void> {
    await super.delete();
    await tryUnlink(this.configPath);
    await tryUnlink(this.imagePath);
    await tryUnlink(this.thumbnailPath);
  }

  async writeConfig(data: Uint8Array | string, extension: string) {
    this.configName = `${this.name}.${extension}`;
    await writeFile(this.configPath!, data);
  }

  async writeImage(data: Uint8Array, extension: string) {
    this.imageName = `${this.name}.${extension}`;
    const imagePath = this.imagePath!;
    await writeFile(imagePath, data);
    await generateThumbnail(imagePath);
  }

  async json() {
    await this.load();
    const parts = this.modelBaseDir
      ? path.relative(this.modelBaseDir, this.path).split(path.sep)
      : [];
    parts.pop();

    const json: Model = {
      type: this.type!,
      id: this.name,
      name: (this.metadata.json as any)?.name || removeFileExtension(this.name),
      metadata: this.metadata.json,
      file: {
        name: this.name,
        parts,
        path: this.path,
        size: (await stat(this.path)).size,
      },
      image: this.image,
      details: this.details,
    };

    return json;
  }
}

type ModelRepositoryEvents = {
  change: () => void;
};

export class ModelRepository extends (EventEmitter as {
  new (): TypedEventEmitter<ModelRepositoryEvents>;
}) {
  private searchPaths: { [key in ModelType]?: string[] } = {};
  private cache: ModelEntity[] | undefined = undefined;

  constructor(private baseDir: string) {
    super();

    for (const type of Object.values(ModelType)) {
      this.searchPaths[type] = [path.join(baseDir, type)];
    }

    let timeout: any = undefined;
    chokidar.watch(baseDir, {}).on('all', (event: string) => {
      if (!['add', 'change', 'unlink'].includes(event)) {
        return;
      }

      this.cache = undefined;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.emit('change');
      }, 250);
    });
  }

  get path() {
    return this.baseDir;
  }

  getEntityPath(type: ModelType, name: string) {
    return path.join(this.baseDir, type, name);
  }

  async refresh() {
    const promises: Promise<ModelEntity | undefined>[] = [];

    for (const [type, paths] of Object.entries(this.searchPaths)) {
      for (const dirPath of paths) {
        await mkdir(dirPath, { recursive: true });
        const items = await walk(dirPath);
        promises.push(
          ...items.map(async item => {
            try {
              const model = await ModelEntity.fromDirent<ModelEntity>(item);
              model.type = type as ModelType;
              model.modelBaseDir = dirPath;
              return model;
            } catch {
              return undefined;
            }
          }),
        );
      }
    }

    const models = (await Promise.allSettled(promises))
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as any).value) as ModelEntity[];
    this.cache = models;
    return models;
  }

  async all(): Promise<ModelEntity[]> {
    if (!this.cache) {
      return await this.refresh();
    }

    return this.cache;
  }

  async type(type: ModelType) {
    const models = await this.all();
    return models.filter(model => model.type === type);
  }

  async get(type: ModelType, name: string): Promise<ModelEntity> {
    const basename = path.basename(name.replace(/[\\/]/g, path.sep));
    const cache = await this.all();

    const model = cache.find(
      model =>
        model.type === type &&
        (model.name === basename || model.simpleName === basename),
    );
    if (!model) {
      throw new Error(`Unable to find model '${name}' of type '${type}'.`);
    }
    await model.load();
    return model;
  }

  async getEmbeddingsPath(): Promise<string | undefined> {
    const embeddingsDir = path.join(this.baseDir, ModelType.EMBEDDING);
    if (await exists(embeddingsDir)) {
      return embeddingsDir;
    }

    return undefined;
  }

  async delete(type: ModelType, name: string): Promise<void> {
    const entity = await this.get(type, name);
    await entity.delete();
  }
}
