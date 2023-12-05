import { makeAutoObservable, toJS } from 'mobx';
import { getUrl } from '../../config';
import { randomSeed } from '../../helpers';
import { ProjectSettings } from '../../types/project';
import { httpGet, httpPost } from '../../http';

export class Project {
  outputFilenames: string[] = [];
  allOutputs: string[] = [];

  constructor(
    public id: number,
    public name: string,
    public settings: ProjectSettings,
  ) {
    makeAutoObservable(this);
    this.refreshOutputs();
  }

  async request() {
    if (this.settings.sampler.seed_randomize) {
      this.settings.sampler.seed = randomSeed();
    }

    this.save();
    await httpPost(`/prompts`, {
      project_id: this.id,
      ...toJS(this.settings),
    });
  }

  async rename(name: string) {
    this.name = name;
    await httpPost(`/projects/${this.id}`, {
      name,
    });
  }

  async save() {
    await httpPost(`/projects/${this.id}`, {
      settings: JSON.stringify(toJS(this.settings)),
    });
  }

  async refreshOutputs() {
    const outputs = await httpGet(`/projects/${this.id}/outputs`);

    if (outputs) {
      this.allOutputs = outputs;
    }
  }

  private _autosaveTimeout: number | undefined = undefined;
  triggerAutosave() {
    clearTimeout(this._autosaveTimeout);
    this._autosaveTimeout = setTimeout(() => this.save(), 5000);
  }

  view(type: string, filename: string) {
    return getUrl(`/projects/${this.id}/${type}s/${filename}`);
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
