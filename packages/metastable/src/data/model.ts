import { EventEmitter } from 'events';
import { FSWatcher, watch } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { JSONFile } from '@metastable/common/fs';
import { MRN, MRNDataParsed } from '@metastable/common/mrn';
import { getModelDetails, SUPPORTED_MODEL_TYPES } from '@metastable/model-info';
import {
  Metamodel,
  Model,
  ModelDetails,
  ModelMetadata,
  ModelType,
} from '@metastable/types';

import { debounce } from '#helpers/common.js';
import {
  CONFIG_EXTENSIONS,
  exists,
  getAvailableName,
  IMAGE_EXTENSIONS,
  removeFileExtension,
  testExtensions,
  tryUnlink,
  walk,
} from '#helpers/fs.js';
import { generateThumbnail, getThumbnailPath } from '#helpers/image.js';
import { Metastable } from '#metastable';
import { FileEntity, Metadata } from './common.js';

const MODEL_EXTENSIONS = [
  'ckpt',
  'pt',
  'bin',
  'pth',
  'safetensors',
  'onnx',
  'st',
  'sft',
  'gguf',
  'msmeta',
];

export class ModelEntity extends FileEntity {
  type: ModelType | undefined = undefined;
  imageName: string | undefined = undefined;
  configName: string | undefined = undefined;
  simpleName: string;
  modelBaseDir: string | undefined = undefined;
  mrnBaseSegments: string[] = [];
  baseParts: string[] = [];
  details: ModelDetails | undefined = undefined;
  metamodel: Metadata<Metamodel> | undefined = undefined;

  constructor(_path: string) {
    super(_path);
    this.simpleName = removeFileExtension(this.name);
  }

  get isMetamodel() {
    return this.name.toLowerCase().endsWith('.msmeta');
  }

  async load(): Promise<void> {
    const split = this.name.split('.');
    if (
      split.length < 2 ||
      !MODEL_EXTENSIONS.includes(split[split.length - 1])
    ) {
      throw new Error('Not a valid model file.');
    }

    await super.load();

    if (!this.imageName) {
      this.imageName = await testExtensions(
        this.metadataPath,
        this.name,
        IMAGE_EXTENSIONS,
      );

      const imagePath = this.imagePath;
      if (imagePath) {
        await generateThumbnail(imagePath);
      }
    }

    if (!this.configName) {
      this.configName = await testExtensions(
        this.baseDir,
        this.name,
        CONFIG_EXTENSIONS,
      );
    }

    if (this.isMetamodel) {
      if (!this.metamodel) {
        this.metamodel = new Metadata(this.path);
        await this.metamodel.get();
      }
    } else if (!this.details && SUPPORTED_MODEL_TYPES.includes(this.type!)) {
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

  async loadMetamodel() {
    if (!this.metamodel || this.details) {
      return;
    }

    try {
      const data = await this.metamodel.get();
      const mainMrn = data.models?.checkpoint || data.models?.diffusionModel;
      if (
        data.version !== 1 ||
        data.type !== ModelType.CHECKPOINT ||
        !data.models ||
        !mainMrn
      ) {
        throw new Error('Invalid metamodel');
      }

      const mrns = [
        data.models.checkpoint,
        data.models.diffusionModel,
        ...(data.models.textEncoders || []),
        data.models.vae,
      ].filter(mrn => !!mrn) as string[];
      if (mrns.includes(this.mrn)) {
        throw new Error('Self-referencing meta model');
      }

      const models = await Promise.all(
        mrns.map(mrn => Metastable.instance.model.get(mrn)),
      );
      if (models.some(model => model.isMetamodel)) {
        throw new Error("Metamodels can't reference other metamodels");
      }

      const mainModel = await Metastable.instance.model.get(mainMrn);
      this.details = mainModel.details;

      this.size = models.reduce((total, model) => total + model.size, 0);
    } catch (e) {
      console.warn(`Unable to load metamodel ${this.mrn} - ${e}`);
      this.details = {
        corrupt: true,
      };
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

  get mrn() {
    return MRN.serialize({
      segments: [...this.mrnBaseSegments, this.fullName],
    });
  }

  get coverMrn() {
    if (this.imageName) {
      return MRN.serialize({
        segments: [...this.mrnBaseSegments, this.fullName, 'cover'],
      });
    }

    return undefined;
  }

  get parts() {
    const currentParts = this.modelBaseDir
      ? path.relative(this.modelBaseDir, this.path).split(path.sep)
      : [];
    currentParts.pop();
    return [...this.baseParts, ...currentParts];
  }

  get fullName() {
    return [...this.parts, this.name].join('/');
  }

  async json() {
    await this.load();

    const json: Model = {
      type: this.type!,
      mrn: this.mrn,
      coverMrn: this.coverMrn,
      id: this.name,
      name: (this.metadata.json as any)?.name || removeFileExtension(this.name),
      metadata: this.metadata.json,
      file: {
        name: this.name,
        parts: this.parts,
        path: this.path,
        size: this.size,
      },
      details: this.details,
    };

    return json;
  }
}

type ModelRepositoryEvents = {
  change: [];
};

export class ModelRepository extends EventEmitter<ModelRepositoryEvents> {
  private searchPaths: {
    [key in ModelType]?: { path: string; name?: string }[];
  } = {};
  private cache: ModelEntity[] | undefined = undefined;
  private watcher: FSWatcher | undefined = undefined;

  constructor(private baseDir: string) {
    super();
  }

  private initWatcher() {
    if (this.watcher) {
      return;
    }

    const onChange = debounce(() => {
      this.emit('change');
    }, 250);

    this.watcher = watch(
      this.baseDir,
      {
        persistent: false,
        recursive: true,
      },
      (_, filePath) => {
        if (filePath?.endsWith('.part')) {
          return;
        }

        this.cache = undefined;
        onChange();
      },
    );
  }

  async cleanup() {
    this.watcher?.close();
  }

  resetCache() {
    this.cache = undefined;
  }

  get path() {
    return this.baseDir;
  }

  getEntityPath(type: ModelType, name: string) {
    return path.join(this.baseDir, type, name);
  }

  async getDownloadPath(type: ModelType, name: string, folder?: string) {
    let dir = path.join(this.baseDir, type);
    if (folder) {
      const configFolders =
        await Metastable.instance.config.get('modelFolders');
      const folderItem = configFolders?.[type]?.find(
        item => item.name === folder,
      );
      if (folderItem) {
        dir = folderItem.path;
      }
    }
    return path.join(dir, name);
  }

  async refresh() {
    const configFolders = await Metastable.instance.config.get('modelFolders');
    for (const type of Object.values(ModelType)) {
      this.searchPaths[type] = [{ path: path.join(this.baseDir, type) }];

      if (configFolders[type]) {
        for (const item of configFolders[type]) {
          if (!item.name || !item.path) {
            continue;
          }

          this.searchPaths[type].push({ ...item });
        }
      }
    }

    const promises: Promise<ModelEntity | undefined>[] = [];

    for (const [modelType, paths] of Object.entries(this.searchPaths)) {
      for (const dirPath of paths) {
        try {
          if (!dirPath.name) {
            await mkdir(dirPath.path, { recursive: true });
          }

          const items = await walk(dirPath.path);
          promises.push(
            ...items.map(async item => {
              try {
                const model = await ModelEntity.fromDirent<ModelEntity>(item);
                model.type = modelType as ModelType;
                model.modelBaseDir = dirPath.path;
                model.baseParts = dirPath.name ? [`~${dirPath.name}`] : [];
                model.mrnBaseSegments = ['model', modelType];
                return model;
              } catch {
                return undefined;
              }
            }),
          );
        } catch {}
      }
    }

    this.initWatcher();

    const models = (await Promise.allSettled(promises))
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as any).value) as ModelEntity[];
    this.cache = models;

    await Promise.allSettled(models.map(model => model.loadMetamodel()));

    return models;
  }

  private async getAvailableEntityName(type: ModelType, name: string) {
    return await getAvailableName(path.join(this.baseDir, type), name);
  }

  async createMetamodel(
    type: ModelType,
    name: string,
    models: Metamodel['models'],
    metadata?: ModelMetadata,
  ) {
    const write = async () => {
      const data: Metamodel = {
        version: 1,
        type,
        models,
      };
      const finalName = await this.getAvailableEntityName(
        type,
        `${name}.msmeta`,
      );
      const filePath = this.getEntityPath(type, finalName);
      const file = new JSONFile(filePath, data);
      await file.writeJson(data);
      if (metadata) {
        const entity: ModelEntity = (await ModelEntity.fromPath(
          filePath,
        )) as any;
        entity.metadata.set(metadata);
      }

      return `mrn:model:${type}:${finalName}`;
    };

    const checkRefs = async () => {
      const mrns = [
        models.checkpoint,
        models.diffusionModel,
        ...(models.textEncoders || []),
        models.vae,
      ].filter(mrn => !!mrn) as string[];
      const all = await this.all();
      return mrns.every(mrn => all.find(model => model.mrn === mrn));
    };

    if (await checkRefs()) {
      return await write();
    } else {
      const onChange = async () => {
        if (await checkRefs()) {
          this.off('change', onChange);
          await write();
        }
      };

      this.on('change', onChange);
    }
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

  async get(mrn: string): Promise<ModelEntity> {
    const parsed = MRN.parse(mrn);
    const realMrn = MRN.serialize({ segments: parsed.segments.slice(0, 3) });

    const models = await this.all();
    const model = models.find(model => model.mrn === realMrn);
    if (!model) {
      throw new Error(`Unable to find model '${realMrn}'.`);
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

  async delete(mrn: string): Promise<void> {
    const entity = await this.get(mrn);
    await entity.delete();
  }

  async resolve(parsed: MRNDataParsed) {
    const option = parsed.segments[3] || 'model';
    const model = await this.get(
      MRN.serialize({ ...parsed, query: undefined }),
    );

    switch (option) {
      case 'model':
        return model.path;
      case 'cover': {
        const size = parsed.query.get('size') || 'full';
        switch (size) {
          case 'thumbnail':
            return model.thumbnailPath;
          case 'full':
            return model.imagePath;
          default:
            throw new Error(`Invalid size option value: ${size}`);
        }
      }
      default:
        throw new Error(`Invalid option value: ${option}`);
    }
  }
}
