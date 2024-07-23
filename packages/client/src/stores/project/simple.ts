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
import { filesize } from '$utils/file';
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
  stepTime: Record<string, number> | undefined = undefined;
  currentTask: Task<ProjectPromptTaskData> | undefined = undefined;

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
      stepTime: observable,
      currentTask: observable,
      selectOutput: action,
      selectTask: action,
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

  async deleteOutput(name: string) {
    this.outputs = this.outputs.filter(output => output.name !== name);
    if (this.currentOutput?.name === name) {
      this.currentOutput = this.outputs[this.outputs.length - 1];
    }

    await API.project.output.delete.mutate({ name, projectId: this.id });
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

  get memoryUsage() {
    const settings = this.settings;
    let totalVram = 0;

    const checkpointName = settings.checkpoint.name;
    if (checkpointName) {
      const model = modelStore.find(ModelType.CHECKPOINT, checkpointName);
      totalVram += model?.file.size ?? 0;
    }

    if (settings.models.lora) {
      for (const lora of settings.models.lora) {
        if (lora.enabled && lora.name) {
          const model = modelStore.find(ModelType.LORA, lora.name);
          totalVram += model?.file.size ?? 0;
        }
      }
    }

    if (settings.models.controlnet) {
      for (const controlnet of settings.models.controlnet) {
        if (controlnet.enabled && controlnet.name) {
          const model = modelStore.find(ModelType.CONTROLNET, controlnet.name);
          totalVram += model?.file.size ?? 0;
        }
      }
    }

    if (settings.models.ipadapter) {
      for (const ipadapter of settings.models.ipadapter) {
        if (ipadapter.enabled && ipadapter.name) {
          const model = modelStore.find(ModelType.IPADAPTER, ipadapter.name);
          totalVram += model?.file.size ?? 0;
        }
      }
    }

    if (settings.upscale?.enabled && settings.upscale?.name) {
      const model = modelStore.find(
        ModelType.UPSCALE_MODEL,
        settings.upscale.name,
      );
      totalVram += model?.file.size ?? 0;
    }

    return totalVram;
  }

  validate(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const settings = this.settings;

    const checkpointName = settings.checkpoint.name;
    if (!checkpointName) {
      errors.push('No checkpoint selected.');
    } else {
      const checkpoint = modelStore.find(ModelType.CHECKPOINT, checkpointName);
      if (!checkpoint) {
        errors.push('Selected checkpoint does not exist.');
      }
    }

    const loras = settings.models.lora;
    if (loras?.length) {
      for (const lora of loras) {
        if (!lora.enabled) {
          continue;
        }

        if (!lora.name) {
          errors.push('No LoRA model selected.');
        } else {
          const model = modelStore.find(ModelType.LORA, lora.name);
          if (!model) {
            errors.push('Selected LoRA does not exist.');
          }
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
          errors.push('No ControlNet model selected.');
        } else {
          const model = modelStore.find(ModelType.CONTROLNET, controlnet.name);
          if (!model) {
            errors.push('Selected ControlNet does not exist.');
          }
        }

        if (!controlnet.image) {
          errors.push('No image input for ControlNet selected.');
        }
      }
    }

    const ipadapters = settings.models.ipadapter;
    if (ipadapters?.length) {
      for (const ipadapter of ipadapters) {
        if (!ipadapter.enabled) {
          continue;
        }

        if (!ipadapter.name) {
          errors.push('No IPAdapter model selected.');
        } else {
          const model = modelStore.find(ModelType.IPADAPTER, ipadapter.name);
          if (!model) {
            errors.push('Selected IPAdapter model does not exist.');
          }
        }

        if (!ipadapter.clipVisionName) {
          errors.push('No CLIP Vision model for IPAdapter selected.');
        } else {
          const model = modelStore.find(
            ModelType.CLIP_VISION,
            ipadapter.clipVisionName,
          );
          if (!model) {
            errors.push('Selected CLIP Vision model does not exist.');
          }
        }

        if (!ipadapter.image) {
          errors.push('No image input for IPAdapter selected.');
        }
      }
    }

    const input = settings.input;
    if (input.type !== 'none' && !input.image) {
      errors.push('No input image selected.');
    }

    if (mainStore.status !== 'ready') {
      errors.push('Backend is not ready.');
    }

    const memroyUsage = this.memoryUsage;
    if (memroyUsage > mainStore.info.vram) {
      warnings.push(
        `This project requires ${filesize(
          memroyUsage,
        )} of memory, this is higher than system memory: ${filesize(
          mainStore.info.vram,
        )}.`,
      );
    } else if (memroyUsage > mainStore.info.vram * 0.8) {
      warnings.push(
        `This project requires ${filesize(
          memroyUsage,
        )} of memory to generate an image. System memory: ${filesize(
          mainStore.info.vram,
        )}.`,
      );
    }

    return { errors, warnings };
  }

  async request() {
    if (this.settings.client.randomizeSeed) {
      this.settings.sampler.seed = randomSeed();
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
    this.outputs.push(...outputs);

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
