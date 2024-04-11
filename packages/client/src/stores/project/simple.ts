import {
  Project as APIProject,
  ImageFile,
  ModelType,
  ProjectPromptTaskData,
  ProjectSettings,
  Task,
  TaskState,
} from '@metastable/types';
import { action, computed, makeObservable, observable, toJS } from 'mobx';

import { API } from '$api';
import { Editor } from '$editor';
import { Point } from '$editor/types';
import { randomSeed } from '$utils/comfy';
import { base64ify, loadImage, prepareImage } from '$utils/image';
import { BaseProject } from './base';
import { mainStore } from '../MainStore';

export function defaultSettings(): ProjectSettings {
  return {
    input: { mode: 'empty', batch_size: 1, width: 512, height: 512 },
    models: {
      base: { name: mainStore.defaultModelName(ModelType.CHECKPOINT) },
      loras: [],
      controlnets: [],
    },
    conditioning: {
      positive: 'an image of a banana',
      negative: 'bad quality',
    },
    sampler: {
      seed: randomSeed(),
      seed_randomize: true,
      steps: 20,
      cfg: 8.0,
      denoise: 1,
      sampler: 'dpm_2',
      scheduler: 'karras',
      tiling: false,
    },
    output: {
      format: 'png',
    },
  };
}

export class SimpleProject extends BaseProject<ProjectSettings> {
  editor: Editor | undefined = undefined;
  addOutputToEditor: Point | undefined = undefined;

  constructor(
    data: Omit<APIProject, 'settings'>,
    settings: ProjectSettings = defaultSettings(),
  ) {
    super(data, settings);
    makeObservable(this, {
      editor: observable,
      preview: computed,
      request: action,
      addLora: action,
      addControlnet: action,
      addIPAdapter: action,
      removeLora: action,
      removeControlnet: action,
      removeIPAdapter: action,
      setSettings: action,
      queue: computed,
      firstPrompt: computed,
      onPromptDone: action,
    });

    mainStore.tasks.on('delete', (task: Task<ProjectPromptTaskData>) => {
      if (task.type === 'prompt' && task.data.outputs) {
        this.onPromptDone(task.data.outputs);
      }
    });
  }

  setSettings(settings: ProjectSettings) {
    if (settings.input.mode === 'empty') {
      settings.input.height ||= 512;
      settings.input.width ||= 512;
      settings.input.batch_size ||= 1;
    }

    settings.models.base.name ||= mainStore.defaultModelName(
      ModelType.CHECKPOINT,
    );
    this.settings = settings;
  }

  get queue(): Task<ProjectPromptTaskData>[] {
    return this.tasks.filter(task => task.type === 'prompt');
  }

  get queueCount() {
    return this.queue.length;
  }

  get firstPrompt() {
    return this.queue.find(
      item => item.state === TaskState.RUNNING || TaskState.PREPARING,
    );
  }

  get progressValue() {
    return this.firstPrompt?.progress;
  }

  get progressMax() {
    return this.firstPrompt ? 1 : undefined;
  }

  get preview() {
    return this.firstPrompt?.data.preview;
  }

  get progressMarquee() {
    return !!this.firstPrompt && !this.firstPrompt.progress;
  }

  validate() {
    const settings = this.settings;
    const checkpointName = settings.models.base.name;
    if (!checkpointName) {
      return 'No checkpoint selected.';
    } else if (
      mainStore.hasFile(ModelType.CHECKPOINT, checkpointName) !== 'downloaded'
    ) {
      return 'Selected checkpoint does not exist.';
    }

    const loras = settings.models.loras;
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

    const controlnets = settings.models.controlnets;
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
    if (
      (input.mode === 'image' || input.mode === 'image_masked') &&
      !input.image
    ) {
      return 'No input image selected.';
    }

    if (mainStore.status !== 'ready') {
      return 'Backend is not ready.';
    }

    return undefined;
  }

  async request() {
    if (this.settings.sampler.seed_randomize) {
      this.settings.sampler.seed = randomSeed();
    }

    this.currentOutput = undefined;

    const settings = toJS(this.settings);
    let width = 512;
    let height = 512;
    if (
      settings.input.mode === 'image' ||
      settings.input.mode === 'image_masked'
    ) {
      const image = await loadImage(settings.input.image);
      width = image.naturalWidth;
      height = image.naturalHeight;
      settings.input.image = await base64ify(settings.input.image);
    } else if (settings.input.mode === 'empty') {
      width = settings.input.width;
      height = settings.input.height;
    }

    if (settings.models.controlnets) {
      for (const controlnet of settings.models.controlnets) {
        controlnet.image = await base64ify(
          await prepareImage(
            controlnet.image,
            width,
            height,
            controlnet.image_mode,
          ),
        );
      }
    }

    if (settings.models.ipadapters) {
      for (const ipadapter of settings.models.ipadapters) {
        ipadapter.image = await base64ify(
          await prepareImage(
            ipadapter.image!,
            width,
            height,
            ipadapter.image_mode,
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

  addLora(name: string, strength = 1) {
    const settings = { ...this.settings };

    if (!settings.models.loras) {
      settings.models.loras = [];
    }

    settings.models.loras.push({
      enabled: true,
      name,
      strength,
    });
    this.settings = settings;
  }

  removeLora(index: number) {
    const settings = { ...this.settings };
    settings.models.loras?.splice(index, 1);
    this.settings = settings;
  }

  addControlnet(name: string, strength = 1) {
    const settings = { ...this.settings };

    if (!settings.models.controlnets) {
      settings.models.controlnets = [];
    }

    settings.models.controlnets.push({
      enabled: true,
      name,
      strength,
      image: '',
      image_mode: 'cover',
    });
    this.settings = settings;
  }

  removeControlnet(index: number) {
    const settings = { ...this.settings };
    settings.models.controlnets?.splice(index, 1);
    this.settings = settings;
  }

  addIPAdapter() {
    const settings = { ...this.settings };

    if (!settings.models.ipadapters) {
      settings.models.ipadapters = [];
    }

    settings.models.ipadapters.push({
      enabled: true,
      weight: 1,
      image_mode: 'cover',
    });
    this.settings = settings;
  }

  removeIPAdapter(index: number) {
    const settings = { ...this.settings };
    settings.models.ipadapters?.splice(index, 1);
    this.settings = settings;
  }

  onPromptDone(outputs: ImageFile[]) {
    this.currentOutput = outputs[0]?.image.url;
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
