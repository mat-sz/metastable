import { FieldHandler, recurseFields } from '@metastable/common';
import {
  Project as APIProject,
  Architecture,
  FieldType,
  ImageFile,
  ModelDetails,
  ModelInputType,
  ModelOutputType,
  ModelType,
  PostprocessSettings,
  ProjectFileType,
  ProjectOrientation,
  ProjectSimpleSettings,
  ProjectTaskData,
  PromptStyleWithSource,
  Task,
  TaskState,
} from '@metastable/types';
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
  toJS,
} from 'mobx';

import { API } from '$api';
import { recommendedResolutions, Resolution } from '$data/resolutions';
import { qualitySamplerSettings } from '$data/samplerSettings';
import { PROMPT_STYLES } from '$data/styles';
import { Editor } from '$editor';
import { Point } from '$editor/types';
import { modelStore } from '$stores/ModelStore';
import { randomSeed } from '$utils/comfy';
import { EXTENSIONS, filesize } from '$utils/file';
import { detectOrientation, fileToBase64 } from '$utils/image';
import { get, set } from '$utils/object';
import { isLocalUrl, resolveImage } from '$utils/url';
import { BaseProject } from './base';
import { mainStore } from '../MainStore';

class SimpleProjectValidator {
  errors: string[] = [];
  warnings: string[] = [];

  constructor(settings: ProjectSimpleSettings) {
    if (settings.models.mode === 'simple') {
      this.validateModel(ModelType.CHECKPOINT, settings.models.checkpoint);
    }

    const input = settings.input;
    if (input.type !== ModelInputType.NONE && !input.image) {
      this.errors.push('No input image selected.');
    }
  }

  validateModel(type: ModelType, mrn?: string) {
    if (!mrn) {
      this.errors.push(`No ${type} model selected.`);
      return;
    }

    const full = modelStore.find(mrn);
    if (!full) {
      this.errors.push(`Selected ${type} does not exist.`);
    } else if (full.details?.corrupt) {
      this.warnings.push(`${type} model may be corrupt.`);
    } else if (full.type !== type) {
      this.errors.push(
        `Model of type ${full.type} selected for field of type ${type}.`,
      );
    }
  }
}

function convertModelItem(type: ModelType, item?: any) {
  if (!item) {
    return;
  }

  if (!item.model && item.name) {
    const model = modelStore.findByName(type, item.name);
    item.model = model?.mrn;
  }
  item.name = undefined;

  if (!item.clipVision && item.clipVisionName) {
    const model = modelStore.findByName(
      ModelType.CLIP_VISION,
      item.clipVisionName,
    );
    item.clipVision = model?.mrn;
    item.clipVisionName = undefined;
  }
}

function convertModelArray(type: ModelType, array?: any[]) {
  if (!array) {
    return;
  }

  for (const item of array) {
    convertModelItem(type, item);
  }
}

export function convertFeatureData(
  settings: any,
  inputPath: string,
  outputPath: string,
) {
  const input = get(settings.models, inputPath);
  if (input) {
    const output = get(settings.featureData, outputPath);
    if (!output) {
      set(settings.featureData, outputPath, input);
    }

    set(settings, inputPath, undefined);
  }
}

export function convertSettings(
  settings: ProjectSimpleSettings,
): ProjectSimpleSettings {
  const newSettings: any = toJS(settings);
  if (!newSettings.featureData) {
    newSettings.featureData = {};
  }

  if (newSettings.checkpoint) {
    if (newSettings.checkpoint.mode === 'advanced') {
      newSettings.models = {
        mode: 'advanced',
      };
    } else {
      convertModelItem(ModelType.CHECKPOINT, newSettings.checkpoint);
      newSettings.models = {
        mode: 'simple',
        checkpoint: newSettings.checkpoint.model,
      };
    }

    if (newSettings.checkpoint.clipSkip) {
      newSettings.models.clipSkip = newSettings.checkpoint.clipSkip;
    }

    newSettings.checkpoint = undefined;
  }

  convertModelArray(ModelType.LORA, newSettings.featureData.lora);
  convertModelItem(ModelType.IPADAPTER, newSettings.featureData.pulid);

  convertModelArray(ModelType.LORA, newSettings.models?.lora);
  convertModelArray(ModelType.CONTROLNET, newSettings.models?.controlnet);
  convertModelArray(ModelType.IPADAPTER, newSettings.models?.ipadapter);

  convertModelItem(ModelType.UPSCALE_MODEL, newSettings.upscale);

  convertFeatureData(newSettings, 'models.lora', 'lora');
  convertFeatureData(newSettings, 'models.controlnet', 'controlnet');
  convertFeatureData(newSettings, 'models.ipadapter', 'ipadapter');
  convertFeatureData(newSettings, 'upscale', 'upscale');
  convertFeatureData(newSettings, 'pulid', 'pulid');

  return newSettings;
}

export function defaultSettings(): ProjectSimpleSettings {
  const checkpoint = modelStore.defaultModel(ModelType.CHECKPOINT);

  return {
    version: 1,
    input: { type: ModelInputType.NONE },
    output: {
      sizeMode: 'auto',
      orientation: 'square',
      lockAspectRatio: false,
      width: 512,
      height: 512,
      batchSize: 1,
      format: 'png',
    },
    models: {
      mode: 'simple',
      checkpoint: checkpoint?.mrn,
    },
    prompt: {
      positive: 'an image of a banana',
      negative: 'bad quality',
    },
    sampler: {
      quality: 'medium',
      seed: randomSeed(),
      steps: 30,
      cfg: 7.0,
      denoise: 1,
      samplerName: 'dpmpp_2m_sde_gpu',
      schedulerName: 'karras',
      tiling: false,
      ...checkpoint?.metadata?.samplerSettings,
    },
    client: {
      randomizeSeed: true,
    },
    featureData: {},
  };
}

interface ProjectSimpleUI {
  collapsed?: Record<string, boolean>;
  imagesSplit?: number[];
}

export class SimpleProject extends BaseProject<
  ProjectSimpleSettings,
  ProjectSimpleUI
> {
  editor: Editor | undefined = undefined;
  addOutputToEditor: Point | undefined = undefined;
  stepTime: Record<string, number> | undefined = undefined;
  currentTask: Task<ProjectTaskData> | undefined = undefined;
  lastOutputName: string | undefined = undefined;

  constructor(data: APIProject) {
    data.settings ??= defaultSettings();
    data.settings = convertSettings(data.settings);
    super(data);

    this.settings.sampler.quality ??= 'custom';
    this.settings.output.sizeMode ??= 'custom';
    this.settings.output.orientation ??= detectOrientation(
      this.settings.output.width,
      this.settings.output.height,
    );
    this.settings.output.lockAspectRatio ??= false;

    makeObservable(this, {
      editor: observable,
      request: action,
      setSettings: action,
      onTaskDone: action,
      stepTime: observable,
      currentTask: observable,
      selectOutput: action,
      selectTask: action,
      showNegativePrompt: computed,
      inputTypes: computed,
      outputType: computed,
      modelDetails: computed,
      architecture: computed,
      lastOutputName: observable,
      availableStyles: computed,
      discard: action,
      isLastOutput: computed,
      autoSizes: computed,
      beforeRequest: action,
      imageFiles: computed,
      viewTask: computed,
    });

    mainStore.tasks.on('delete', (task: Task<ProjectTaskData>) => {
      if (task.data.projectId === this.id && task.data.outputs) {
        this.onTaskDone(task);
      }
    });
  }

  async useInputImage(url: string) {
    const settings = this.settings;

    if (settings.input.type === ModelInputType.NONE) {
      settings.input.type = ModelInputType.IMAGE;
    }
    settings.input.mask = undefined;
    settings.input.image = url;

    this.setSettings(settings);
  }

  setSettings(settings: ProjectSimpleSettings) {
    const previousOutputType = this.outputType;
    settings = convertSettings(settings);

    settings.output.height ||= 512;
    settings.output.width ||= 512;
    settings.output.batchSize ||= 1;

    if (settings.models.mode === 'simple') {
      settings.models.checkpoint ||= mainStore.defaultModelMrn(
        ModelType.CHECKPOINT,
      );
    }

    if (settings.output.sizeMode === 'auto') {
      const recommended = this.autoSizes?.[settings.output.orientation];
      if (recommended) {
        settings.output.width = recommended[0];
        settings.output.height = recommended[1];
      }
    } else {
      settings.output.orientation ??= detectOrientation(
        settings.output.width,
        settings.output.height,
      );
    }

    if (settings.sampler.quality !== 'custom') {
      const samplerSettings = qualitySamplerSettings[settings.sampler.quality];
      if (samplerSettings) {
        settings.sampler = { ...settings.sampler, ...samplerSettings };
      }
    }

    this.settings = settings;

    if (previousOutputType !== this.outputType) {
      if (this.outputType === ModelOutputType.VIDEO) {
        // TODO: Update this when support for better video formats is added.
        this.settings.output.format = 'png';
      } else {
        this.settings.output.format = 'png';
      }
    }

    if (!this.inputTypes.includes(this.settings.input.type)) {
      this.settings.input.type = this.inputTypes[0];
    }
  }

  get imageFiles(): ImageFile[] {
    const files: ImageFile[] = [];

    for (const type of Object.values(ProjectFileType)) {
      files.push(...this.files[type].map(file => ({ ...file, parts: [type] })));
    }

    return files;
  }

  get autoSizes(): Record<ProjectOrientation, Resolution> | undefined {
    const recommended = recommendedResolutions[this.architecture!];
    if (!recommended) {
      return undefined;
    }

    const sizes: any = {};
    for (const key of Object.keys(recommended)) {
      sizes[key] = (recommended as any)[key][0];
    }
    return sizes;
  }

  get modelDetails(): ModelDetails | undefined {
    const data = this.settings.models;
    const model =
      data.mode === 'advanced' && data.diffusionModel
        ? modelStore.find(data.diffusionModel)
        : modelStore.find(data.checkpoint);
    return model?.details;
  }

  get showNegativePrompt(): boolean {
    return this.modelDetails?.supportsNegativePrompt ?? true;
  }

  get inputTypes(): ModelInputType[] {
    return (
      this.modelDetails?.inputTypes || [
        ModelInputType.NONE,
        ModelInputType.IMAGE_MASKED,
      ]
    );
  }

  get outputType(): ModelOutputType {
    return this.modelDetails?.outputType || ModelOutputType.IMAGE;
  }

  get architecture(): Architecture | undefined {
    return this.modelDetails?.architecture;
  }

  get memoryUsage() {
    const settings = this.settings;
    let totalVram = 0;

    if (settings.models.mode === 'advanced') {
      totalVram += [
        settings.models.checkpoint,
        settings.models.diffusionModel,
        ...(settings.models.textEncoders || []),
        settings.models.vae,
      ].reduce((size, current) => size + modelStore.size(current), 0);
    } else {
      totalVram += modelStore.size(settings.models.checkpoint);
    }

    this.recurseFields((parent, key, field) => {
      if (field.type === FieldType.MODEL) {
        totalVram += modelStore.size(parent[key]);
      }
    });

    return totalVram;
  }

  validate(): { errors: string[]; warnings: string[] } {
    const validator = new SimpleProjectValidator(this.settings);
    const { errors, warnings } = validator;

    if (mainStore.status !== 'ready') {
      errors.push('Backend is not ready.');
    }

    if (mainStore.config.data?.generation?.memoryWarnings) {
      const memoryUsage = this.memoryUsage;
      if (memoryUsage > mainStore.info.vram) {
        warnings.push(
          `This project requires ${filesize(
            memoryUsage,
          )} of memory, this is higher than system memory: ${filesize(
            mainStore.info.vram,
          )}.`,
        );
      } else if (memoryUsage > mainStore.info.vram * 0.8) {
        warnings.push(
          `This project requires ${filesize(
            memoryUsage,
          )} of memory to generate an image. System memory: ${filesize(
            mainStore.info.vram,
          )}.`,
        );
      }
    }

    return { errors: errors.filter(error => !!error) as string[], warnings };
  }

  get availableStyles() {
    const systemStyles: PromptStyleWithSource[] = PROMPT_STYLES.map(style => ({
      ...style,
      source: 'system',
    }));
    const userStyles: PromptStyleWithSource[] = (
      mainStore.config.data?.styles || []
    ).map(style => ({ ...style, source: 'user' }));
    const allStyles = [...systemStyles, ...userStyles];

    return allStyles.filter(
      style =>
        !style.architecture ||
        style.architecture === 'any' ||
        style.architecture === this.architecture,
    );
  }

  get isLastOutput() {
    return (
      !!this.lastOutputName &&
      this.currentOutput?.name === this.lastOutputName &&
      !this.firstTask
    );
  }

  async discard() {
    if (this.isLastOutput) {
      await this.deleteFile(ProjectFileType.OUTPUT, this.lastOutputName!);
    }

    await this.request();
  }

  async dismissTask(taskId: string) {
    const task = this.tasks.find(task => task.id === taskId);
    if (!task) {
      return;
    }

    switch (task.state) {
      case TaskState.QUEUED:
      case TaskState.FAILED:
        await API.task.dismiss.mutate({ queueId: 'project', taskId: task.id });
        return;
      case TaskState.PREPARING:
      case TaskState.RUNNING:
        await API.task.cancel.mutate({ queueId: 'project', taskId: task.id });
        return;
    }
  }

  async clearQueue() {
    await Promise.all(
      this.queued.map(item =>
        API.task.dismiss.mutate({ queueId: 'project', taskId: item.id }),
      ),
    );
  }

  async cancel() {
    const task = this.firstTask;
    if (!task) {
      return;
    }

    await API.task.cancel.mutate({ queueId: 'project', taskId: task.id });
  }

  private async handleImage(type: ProjectFileType, parent: any, key: string) {
    const url = parent?.[key];
    if (!url) {
      return;
    }

    if (isLocalUrl(url)) {
      const { data, mime } = await fileToBase64(url);
      const ext = EXTENSIONS[mime];
      if (!mime || !ext) {
        throw new Error('Unable to upload file');
      }

      const file = await API.project.file.create.mutate({
        projectId: this.id,
        type,
        data,
        ext,
      });
      runInAction(() => {
        parent[key] = file.mrn;
      });
      URL.revokeObjectURL(url);
    }
  }

  private recurseFields(onField: FieldHandler) {
    recurseFields(this.settings.featureData, this.extraFields, onField);
  }

  private async handleImages() {
    await this.handleImage(ProjectFileType.INPUT, this.settings.input, 'image');
    await this.handleImage(ProjectFileType.MASK, this.settings.input, 'mask');

    const promises: Promise<void>[] = [];
    this.recurseFields((parent, key, field) => {
      if (field.type === FieldType.IMAGE) {
        promises.push(this.handleImage(ProjectFileType.INPUT, parent, key));
      }
    });
    await Promise.all(promises);
  }

  async save(name?: string, draft?: boolean, auto = false) {
    await this.handleImages();
    await super.save(name, draft, auto);
  }

  beforeRequest() {
    if (this.settings.client.randomizeSeed) {
      this.settings.sampler.seed = randomSeed();
    }

    const style = this.settings.prompt.style;
    if (style) {
      const saved = this.availableStyles.find(item => item.id === style.id);
      this.settings.prompt.style = saved ? { ...saved } : undefined;
    }
  }

  get viewTask() {
    return (
      this.currentTask || (!this.currentOutput ? this.tasks[0] : undefined)
    );
  }

  async request() {
    await this.handleImages();
    this.beforeRequest();

    this.selectOutput(undefined);
    this.save();

    await API.project.prompt.mutate({
      projectId: this.id,
      settings: this.settings,
    });
  }

  async postprocess(settings: PostprocessSettings) {
    this.selectOutput(undefined);
    await API.project.postprocess.mutate({
      projectId: this.id,
      settings: settings,
    });
  }

  selectTask(task?: Task<ProjectTaskData>) {
    this.mode = 'images';
    this.currentTask = task;
    this.currentOutput = undefined;
  }

  selectOutput(output?: ImageFile) {
    this.mode = 'images';
    this.currentOutput = output;
    this.currentTask = undefined;
  }

  onTaskDone(task: Task<ProjectTaskData>) {
    const outputs = task.data.outputs!;
    this.selectOutput(outputs[0]);
    this.files.output.push(...outputs);
    this.lastOutputName = outputs[0].name;

    this.stepTime = task.data.stepTime;

    if (this.addOutputToEditor) {
      this.editor?.addImage(resolveImage(outputs[0].mrn), {
        name: `Output (${outputs[0].name})`,
        offset: toJS(this.addOutputToEditor),
      });
      this.addOutputToEditor = undefined;
    }
  }
}
