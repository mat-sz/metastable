import {
  Project as APIProject,
  CheckpointType,
  ImageFile,
  ModelType,
  ProjectFileType,
  ProjectModel,
  ProjectOrientation,
  ProjectPromptTaskData,
  ProjectSimpleSettings,
  PromptStyleWithSource,
  Task,
  TaskState,
} from '@metastable/types';
import { action, computed, makeObservable, observable, toJS } from 'mobx';

import { recommendedResolutions, Resolution } from '$/data/resolutions';
import { PROMPT_STYLES } from '$/data/styles';
import { API } from '$api';
import { Editor } from '$editor';
import { Point } from '$editor/types';
import { modelStore } from '$stores/ModelStore';
import { randomSeed } from '$utils/comfy';
import { filesize } from '$utils/file';
import { base64ify, detectOrientation, prepareImage } from '$utils/image';
import { BaseProject } from './base';
import { mainStore } from '../MainStore';

class SimpleProjectValidator {
  errors: string[] = [];
  warnings: string[] = [];

  constructor(settings: ProjectSimpleSettings) {
    if (settings.checkpoint.mode === 'advanced') {
      this.validateModel(ModelType.UNET, settings.checkpoint.unet);
      this.validateModel(ModelType.CLIP, settings.checkpoint.clip1);
      this.validateModel(ModelType.VAE, settings.checkpoint.vae);

      if (settings.checkpoint.clip2?.name) {
        this.validateModel(ModelType.CLIP, settings.checkpoint.clip2);

        if (settings.checkpoint.clip1.name === settings.checkpoint.clip2.name) {
          this.errors.push('CLIP1 must be a different model from CLIP2.');
        }
      }
    } else {
      this.validateModel(ModelType.CHECKPOINT, settings.checkpoint);
    }

    const loras = settings.models.lora;
    if (loras?.length) {
      for (const lora of loras) {
        if (!lora.enabled) {
          continue;
        }

        this.validateModel(ModelType.LORA, lora);
      }
    }

    const controlnets = settings.models.controlnet;
    if (controlnets?.length) {
      for (const controlnet of controlnets) {
        if (!controlnet.enabled) {
          continue;
        }

        this.validateModel(ModelType.CONTROLNET, controlnet);

        if (!controlnet.image) {
          this.errors.push('No image input for ControlNet selected.');
        }
      }
    }

    const ipadapters = settings.models.ipadapter;
    if (ipadapters?.length) {
      for (const ipadapter of ipadapters) {
        if (!ipadapter.enabled) {
          continue;
        }

        this.validateModel(ModelType.IPADAPTER, ipadapter);

        if (!ipadapter.clipVisionName) {
          this.errors.push('No CLIP Vision model for IPAdapter selected.');
        } else {
          const model = modelStore.find(
            ModelType.CLIP_VISION,
            ipadapter.clipVisionName,
          );
          if (!model) {
            this.errors.push('Selected CLIP Vision model does not exist.');
          }
        }

        if (!ipadapter.image) {
          this.errors.push('No image input for IPAdapter selected.');
        }
      }
    }

    const input = settings.input;
    if (input.type !== 'none' && !input.image) {
      this.errors.push('No input image selected.');
    }
  }

  validateModel(type: ModelType, model: ProjectModel) {
    if (!model.name) {
      this.errors.push(`No ${type} model selected.`);
      return;
    }

    const full = modelStore.find(type, model.name);
    if (!full) {
      this.errors.push(`Selected ${type} does not exist.`);
    } else if (full.details?.corrupt) {
      this.warnings.push(`${type} model may be corrupt.`);
    }
  }
}

export function defaultSettings(): ProjectSimpleSettings {
  const checkpoint = modelStore.defaultModel(ModelType.CHECKPOINT);

  return {
    version: 1,
    input: { type: 'none' },
    output: {
      sizeMode: 'auto',
      orientation: 'square',
      lockAspectRatio: false,
      width: 512,
      height: 512,
      batchSize: 1,
      format: 'png',
    },
    checkpoint: {
      mode: 'simple',
      name: checkpoint?.file.name,
    },
    models: {
      lora: [],
      controlnet: [],
    },
    prompt: {
      positive: 'an image of a banana',
      negative: 'bad quality',
    },
    sampler: {
      seed: randomSeed(),
      steps: 20,
      cfg: 8.0,
      denoise: 1,
      samplerName: 'dpm_2',
      schedulerName: 'karras',
      tiling: false,
      ...checkpoint?.metadata?.samplerSettings,
    },
    client: {
      randomizeSeed: true,
    },
  };
}

interface ProjectSimpleUI {
  collapsed?: Record<string, boolean>;
}

export class SimpleProject extends BaseProject<
  ProjectSimpleSettings,
  ProjectSimpleUI
> {
  editor: Editor | undefined = undefined;
  addOutputToEditor: Point | undefined = undefined;
  stepTime: Record<string, number> | undefined = undefined;
  currentTask: Task<ProjectPromptTaskData> | undefined = undefined;
  lastOutputName: string | undefined = undefined;

  constructor(data: APIProject) {
    data.settings ??= defaultSettings();
    super(data);

    this.settings.output.sizeMode ??= 'custom';
    this.settings.output.orientation ??= detectOrientation(
      this.settings.output.width,
      this.settings.output.height,
    );
    this.settings.output.lockAspectRatio ??= false;

    makeObservable(this, {
      editor: observable,
      preview: computed,
      request: action,
      addModel: action,
      removeModel: action,
      setSettings: action,
      prompts: computed,
      firstPrompt: computed,
      onPromptDone: action,
      stepTime: observable,
      currentTask: observable,
      selectOutput: action,
      selectTask: action,
      checkpointType: computed,
      lastOutputName: observable,
      availableStyles: computed,
      discard: action,
      isLastOutput: computed,
      queued: computed,
    });

    mainStore.tasks.on('delete', (task: Task<ProjectPromptTaskData>) => {
      if (
        task.type === 'prompt' &&
        task.data.projectId === this.id &&
        task.data.outputs
      ) {
        this.onPromptDone(task);
      }
    });
  }

  async useInputImage(url: string) {
    const settings = this.settings;
    const res = await fetch(url);
    const blob = await res.blob();

    if (settings.input.type === 'none') {
      settings.input.type = 'image';
    } else {
      settings.input.mask = undefined;
    }
    settings.input.image = URL.createObjectURL(blob);

    this.setSettings(settings);
  }

  setSettings(settings: ProjectSimpleSettings) {
    settings.output.height ||= 512;
    settings.output.width ||= 512;
    settings.output.batchSize ||= 1;

    if (settings.checkpoint.mode === 'advanced') {
      settings.checkpoint.unet ??= {};
      settings.checkpoint.clip1 ??= {};
      settings.checkpoint.vae ??= {};

      settings.checkpoint.unet.name ||= mainStore.defaultModelName(
        ModelType.UNET,
      );
    } else {
      settings.checkpoint.name ||= mainStore.defaultModelName(
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

    this.settings = settings;
  }

  get autoSizes(): Record<ProjectOrientation, Resolution> | undefined {
    const sizes: any = {};
    const recommended = recommendedResolutions[this.checkpointType!];
    if (recommended) {
      for (const key of Object.keys(recommended)) {
        sizes[key] = (recommended as any)[key][0];
      }

      return sizes;
    }

    return undefined;
  }

  get checkpointType(): CheckpointType | undefined {
    const data = this.settings.checkpoint;
    const model =
      data.mode === 'advanced'
        ? modelStore.find(ModelType.UNET, data.unet.name)
        : modelStore.find(ModelType.CHECKPOINT, data.name);
    return model?.details?.checkpointType;
  }

  get prompts(): Task<ProjectPromptTaskData>[] {
    return this.tasks.filter(task => task.type === 'prompt');
  }

  get firstPrompt() {
    return this.prompts.find(
      item =>
        item.state === TaskState.RUNNING || item.state === TaskState.PREPARING,
    );
  }

  get preview() {
    return this.firstPrompt?.data.preview;
  }

  get memoryUsage() {
    const settings = this.settings;
    let totalVram = 0;

    if (settings.checkpoint.mode === 'advanced') {
      totalVram += modelStore.size(
        ModelType.UNET,
        settings.checkpoint.unet.name,
      );
      totalVram += modelStore.size(
        ModelType.CLIP,
        settings.checkpoint.clip1.name,
      );
      totalVram += modelStore.size(
        ModelType.CLIP,
        settings.checkpoint.clip2?.name,
      );
      totalVram += modelStore.size(ModelType.VAE, settings.checkpoint.vae.name);
    } else {
      totalVram += modelStore.size(
        ModelType.CHECKPOINT,
        settings.checkpoint.name,
      );
    }

    if (settings.models.lora) {
      for (const lora of settings.models.lora) {
        if (lora.enabled && lora.name) {
          totalVram += modelStore.size(ModelType.LORA, lora.name);
        }
      }
    }

    if (settings.models.controlnet) {
      for (const controlnet of settings.models.controlnet) {
        if (controlnet.enabled && controlnet.name) {
          totalVram += modelStore.size(ModelType.CONTROLNET, controlnet.name);
        }
      }
    }

    if (settings.models.ipadapter) {
      for (const ipadapter of settings.models.ipadapter) {
        if (ipadapter.enabled && ipadapter.name) {
          totalVram += modelStore.size(ModelType.IPADAPTER, ipadapter.name);
        }
      }
    }

    if (settings.upscale?.enabled && settings.upscale?.name) {
      totalVram += modelStore.size(
        ModelType.UPSCALE_MODEL,
        settings.upscale.name,
      );
    }

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
        style.architecture === this.checkpointType,
    );
  }

  get isLastOutput() {
    return (
      !!this.lastOutputName &&
      this.currentOutput?.name === this.lastOutputName &&
      !this.firstPrompt
    );
  }

  async discard() {
    if (this.isLastOutput) {
      await this.deleteFile(ProjectFileType.OUTPUT, this.lastOutputName!);
    }

    await this.request();
  }

  get queued() {
    return this.prompts.filter(
      item =>
        item.state !== TaskState.RUNNING && item.state !== TaskState.CANCELLING,
    );
  }

  async dismissTask(taskId: string) {
    const task = this.prompts.find(task => task.id === taskId);
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
    const task = this.firstPrompt;
    if (!task) {
      return;
    }

    await API.task.cancel.mutate({ queueId: 'project', taskId: task.id });
  }

  async request() {
    if (this.settings.client.randomizeSeed) {
      this.settings.sampler.seed = randomSeed();
    }

    const style = this.settings.prompt.style;
    if (style) {
      const saved = this.availableStyles.find(item => item.id === style.id);
      this.settings.prompt.style = saved ? { ...saved } : undefined;
    }

    this.selectOutput(undefined);

    const settings = toJS(this.settings);
    const width = settings.output.width;
    const height = settings.output.height;

    if (
      settings.input.type === 'image' ||
      settings.input.type === 'image_masked'
    ) {
      settings.input.processedImage = await prepareImage(
        settings.input.image!,
        width,
        height,
        settings.input.imageMode,
        settings.input.type === 'image_masked'
          ? settings.input.mask
          : undefined,
      );
    }

    if (settings.models.controlnet) {
      for (const controlnet of settings.models.controlnet) {
        if (!controlnet.image) {
          continue;
        }

        controlnet.image = await base64ify(
          await prepareImage(
            controlnet.image,
            width,
            height,
            controlnet.imageMode,
          ),
        );
      }
    }

    if (settings.models.ipadapter) {
      for (const ipadapter of settings.models.ipadapter) {
        if (!ipadapter.image) {
          continue;
        }

        ipadapter.image = await base64ify(
          await prepareImage(
            ipadapter.image!,
            width,
            height,
            ipadapter.imageMode,
          ),
        );
      }
    }

    this.save();
    await API.project.prompt.mutate({
      projectId: this.id,
      settings,
    });
  }

  addModel(
    type: ModelType.CONTROLNET | ModelType.IPADAPTER | ModelType.LORA,
    name: string,
    strength = 1,
  ) {
    const settings = { ...this.settings };
    if (!settings.models[type]) {
      settings.models[type] = [];
    }

    switch (type) {
      case ModelType.CONTROLNET:
        this.settings.models[type]?.push({
          enabled: true,
          name,
          strength,
          image: '',
          imageMode: 'cover',
        });
        break;
      case ModelType.IPADAPTER:
        this.settings.models[type]?.push({
          enabled: true,
          name,
          clipVisionName: '',
          strength,
          image: '',
          imageMode: 'cover',
        });
        break;
      default:
        this.settings.models[type]?.push({
          enabled: true,
          name,
          strength,
        });
    }

    this.settings = settings;
  }

  removeModel(
    type: ModelType.CONTROLNET | ModelType.IPADAPTER | ModelType.LORA,
    index: number,
  ) {
    const settings = { ...this.settings };
    settings.models[type]?.splice(index, 1);
    this.settings = settings;
  }

  selectTask(task?: Task<ProjectPromptTaskData>) {
    this.mode = 'images';
    this.currentTask = task;
    this.currentOutput = undefined;
  }

  selectOutput(output?: ImageFile) {
    this.mode = 'images';
    this.currentOutput = output;
    this.currentTask = undefined;
  }

  onPromptDone(task: Task<ProjectPromptTaskData>) {
    const outputs = task.data.outputs!;
    this.selectOutput(outputs[0]);
    this.files.output.push(...outputs);
    this.lastOutputName = outputs[0].name;

    this.stepTime = task.data.stepTime;

    if (this.addOutputToEditor) {
      this.editor?.addImage(outputs[0].image.url, {
        name: `Output (${outputs[0].name})`,
        offset: toJS(this.addOutputToEditor),
      });
      this.addOutputToEditor = undefined;
    }
  }
}
