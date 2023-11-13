import { makeAutoObservable, toJS } from 'mobx';
import { getUrl } from '../../config';
import { randomSeed } from '../../helpers';

interface Prompt {
  batch_size: number;
  width: number;
  height: number;
  checkpoint_name: string;
  positive_prompt: string;
  negative_prompt: string;
  seed: number;
  seed_randomize: boolean;
  steps: number;
  cfg: number;
  sampler_name: string;
  scheduler_name: string;
}

export class Project {
  id = 'test_project';
  prompt: Prompt = {
    batch_size: 1,
    width: 512,
    height: 512,
    checkpoint_name: 'v1-5-pruned-emaonly.safetensors',
    positive_prompt: 'an image of a banana',
    negative_prompt: 'bad quality',
    seed: randomSeed(),
    seed_randomize: true,
    steps: 20,
    cfg: 8.0,
    sampler_name: 'dpm_2',
    scheduler_name: 'karras',
  };
  outputFilenames: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  async request() {
    if (this.prompt.seed_randomize) {
      this.prompt.seed = randomSeed();
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
