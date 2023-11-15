import { makeAutoObservable, toJS } from 'mobx';
import { getUrl } from '../../config';
import { randomSeed } from '../../helpers';

interface Prompt {
  input: { batch_size: number; width: number; height: number };
  models: {
    base: { name: string };
  };
  conditioning: {
    positive: string;
    negative: string;
  };
  sampler: {
    seed: number;
    seed_randomize: boolean;
    steps: number;
    cfg: number;
    denoise: number;
    sampler: string;
    scheduler: string;
  };
}

export class Project {
  prompt: Prompt = {
    input: { batch_size: 1, width: 512, height: 512 },
    models: { base: { name: 'v1-5-pruned-emaonly.safetensors' } },
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
  outputFilenames: string[] = [];

  constructor(public id: string) {
    makeAutoObservable(this);
  }

  async request() {
    if (this.prompt.sampler.seed_randomize) {
      this.prompt.sampler.seed = randomSeed();
    }

    await fetch(getUrl('/prompt'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_id: this.id, ...toJS(this.prompt) }),
    });
  }

  view(type: string, filename: string) {
    const url = new URL(getUrl('/view'));
    url.searchParams.append('project_id', this.id);
    url.searchParams.append('type', type);
    url.searchParams.append('filename', filename);
    return url.toString();
  }
}
