import * as fsize from 'filesize';
import { ModelType, ProjectSettings } from '@metastable/types';

import { mainStore } from './stores/MainStore';

export function randomSeed() {
  const min = 0;
  const max = 1125899906842624;
  const range = max - min;
  return Math.floor(Math.random() * range + min);
}

export function arrayMove<T>(array: T[], from: number, to?: number): T[] {
  to ??= array.length - 1;
  const newArray = [...array];
  newArray.splice(to, 0, ...newArray.splice(from, 1));
  return newArray;
}

export function filesize(value: number) {
  return fsize.filesize(value, { standard: 'jedec' });
}

export function defaultProjectSettings(): ProjectSettings {
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
  };
}

export function fixSettings(settings: ProjectSettings) {
  if (settings.input.mode === 'empty') {
    settings.input.height ||= 512;
    settings.input.width ||= 512;
    settings.input.batch_size ||= 1;
  }

  settings.models.base.name ||= mainStore.defaultModelName(
    ModelType.CHECKPOINT,
  );
  return settings;
}

export function validateProject(settings: ProjectSettings): string | undefined {
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

export async function copy(text: string) {
  try {
    if ('ClipboardItem' in window) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    //
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;

    area.ariaHidden = 'true';

    area.style.all = 'unset';

    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.clip = 'rect(0, 0, 0, 0)';

    area.style.whiteSpace = 'pre';
    area.style.userSelect = 'text';

    document.body.appendChild(area);
    area.focus();
    area.select();

    document.execCommand('copy');
    document.body.removeChild(area);
  } catch {
    //
  }
}
