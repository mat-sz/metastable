import * as fsize from 'filesize';
import { ProjectSettings } from './types/project';
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
      base: { name: mainStore.info.models.checkpoints?.[0]?.name },
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
    },
  };
}

export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((onSuccess, onError) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        onSuccess((reader.result as string).split(',')[1]);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      onError(e);
    }
  });
}

export function validateSettings(settings: ProjectSettings) {
  if (settings.input.mode === 'empty') {
    settings.input.height ||= 512;
    settings.input.width ||= 512;
    settings.input.batch_size ||= 1;
  }

  settings.models.base.name ||= mainStore.info.models.checkpoints?.[0]?.name;
  return settings;
}
