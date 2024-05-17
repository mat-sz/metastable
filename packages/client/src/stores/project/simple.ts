import {
  Project as APIProject,
  ImageFile,
  ModelType,
  ProjectPromptTaskData,
  ProjectSimpleSettings,
  Task,
  TaskState,
} from '@metastable/types';
import { action, computed, makeObservable, observable, toJS } from 'mobx';

import { API } from '$api';
import { Editor } from '$editor';
import { Point } from '$editor/types';
import { modelStore } from '$stores/ModelStore';
import { randomSeed } from '$utils/comfy';
import { base64ify, prepareImage } from '$utils/image';
import { BaseProject } from './base';
import { mainStore } from '../MainStore';

export function defaultSettings(): ProjectSimpleSettings {
  const checkpoint = modelStore.defaultModel(ModelType.CHECKPOINT);

  return {
    version: 1,
    input: { type: 'none' },
    output: {
      width: 512,
      height: 512,
      batchSize: 1,
      format: 'png',
    },
    checkpoint: {
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

export class SimpleProject extends BaseProject<ProjectSimpleSettings> {
  editor: Editor | undefined = undefined;
  addOutputToEditor: Point | undefined = undefined;

  constructor(
    data: Omit<APIProject, 'settings'>,
    settings: ProjectSimpleSettings = defaultSettings(),
  ) {
    super(data, settings);
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
    });

    mainStore.tasks.on('delete', (task: Task<ProjectPromptTaskData>) => {
      if (
        task.type === 'prompt' &&
        task.data.projectId === this.id &&
        task.data.outputs
      ) {
        this.onPromptDone(task.data.outputs);
      }
    });
  }

  setSettings(settings: ProjectSimpleSettings) {
    settings.output.height ||= 512;
    settings.output.width ||= 512;
    settings.output.batchSize ||= 1;

    settings.checkpoint.name ||= mainStore.defaultModelName(
      ModelType.CHECKPOINT,
    );
    this.settings = settings;
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

  validate() {
    const settings = this.settings;
    const checkpointName = settings.checkpoint.name;
    if (!checkpointName) {
      return 'No checkpoint selected.';
    } else if (
      mainStore.hasFile(ModelType.CHECKPOINT, checkpointName) !== 'downloaded'
    ) {
      return 'Selected checkpoint does not exist.';
    }

    const loras = settings.models.lora;
    if (loras?.length) {
      for (const lora of loras) {
        if (!lora.enabled) {
          continue;
        }

        if (!lora.name) {
          return 'No LoRA selected.';
        } else if (
          mainStore.hasFile(ModelType.LORA, lora.name) !== 'downloaded'
        ) {
          return 'Selected LoRA does not exist.';
        }
      }
    }

    const controlnets = settings.models.controlnet;
    if (controlnets?.length) {
      for (const controlnet of controlnets) {
        if (!controlnet.enabled) {
          continue;
        }

        if (!controlnet.name) {
          return 'No ControlNet selected.';
        } else if (
          mainStore.hasFile(ModelType.CONTROLNET, controlnet.name) !==
          'downloaded'
        ) {
          return 'Selected ControlNet does not exist.';
        } else if (!controlnet.image) {
          return 'No image input for ControlNet selected.';
        }
      }
    }

    const input = settings.input;
    if (input.type !== 'none' && !input.image) {
      return 'No input image selected.';
    }

    if (mainStore.status !== 'ready') {
      return 'Backend is not ready.';
    }

    return undefined;
  }

  async request() {
    if (this.settings.client.randomizeSeed) {
      this.settings.sampler.seed = randomSeed();
    }

    this.currentOutput = undefined;

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

  onPromptDone(outputs: ImageFile[]) {
    this.currentOutput = outputs[0];
    this.outputs.push(...outputs);

    if (this.addOutputToEditor) {
      this.editor?.addImage(outputs[0].image.url, {
        name: `Output (${outputs[0].name})`,
        offset: toJS(this.addOutputToEditor),
      });
      this.addOutputToEditor = undefined;
    }
  }
}
