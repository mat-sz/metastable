import { makeAutoObservable, toJS } from 'mobx';
import { getUrl } from '../../config';
import { randomSeed } from '../../helpers';
import { ProjectSettings } from '../../types/project';

export class Project {
  outputFilenames: string[] = [];

  constructor(
    public id: number,
    public name: string,
    public settings: ProjectSettings,
  ) {
    makeAutoObservable(this);
  }

  async request() {
    if (this.settings.sampler.seed_randomize) {
      this.settings.sampler.seed = randomSeed();
    }

    await fetch(getUrl('/prompts'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_id: this.id, ...toJS(this.settings) }),
    });
  }

  view(type: string, filename: string) {
    const url = new URL(getUrl('/view'));
    url.searchParams.append('project_id', `${this.id}`);
    url.searchParams.append('type', type);
    url.searchParams.append('filename', filename);
    return url.toString();
  }

  addLora(name: string, strength = 1) {
    const settings = { ...this.settings };
    settings.models.loras.push({
      name,
      strength,
    });
    this.settings = settings;
  }
}
