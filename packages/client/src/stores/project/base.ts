import { action, makeObservable, observable, runInAction, toJS } from 'mobx';
import { Project as APIProject } from '@metastable/types';

import { API } from '@api';
import { getStaticUrl } from '@utils/url';

export class BaseProject<T = any> {
  outputFilenames: string[] = [];
  allInputs: string[] = [];
  allOutputs: string[] = [];
  mode: string = 'images';
  id;
  name;
  type;

  constructor(
    data: APIProject,
    public settings: T,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.outputFilenames = data.lastOutput ? [data.lastOutput] : [];

    this.refreshInputs();
    this.refreshOutputs();
    makeObservable(this, {
      outputFilenames: observable,
      allInputs: observable,
      allOutputs: observable,
      mode: observable,
      id: observable,
      name: observable,
      type: observable,
      settings: observable,
      rename: action,
      save: action,
      refreshInputs: action,
      refreshOutputs: action,
      triggerAutosave: action,
    });
  }

  async rename(name: string) {
    const json = await API.projects.update(this.id, { name });
    this.id = json.id;
    this.name = json.name;
  }

  async save() {
    const settings = toJS(this.settings);

    await API.projects.update(this.id, {
      settings: JSON.stringify(settings),
    });
  }

  async refreshInputs() {
    const inputs = await API.projects.inputs(this.id);
    console.log(inputs);

    if (inputs) {
      runInAction(() => {
        this.allInputs = inputs;
      });
    }
  }

  async refreshOutputs() {
    const outputs = await API.projects.outputs(this.id);

    if (outputs) {
      runInAction(() => {
        this.allOutputs = outputs;
      });
    }
  }

  private _autosaveTimeout: number | undefined = undefined;
  triggerAutosave() {
    clearTimeout(this._autosaveTimeout);
    this._autosaveTimeout = setTimeout(() => this.save(), 5000) as any;
  }

  view(type: string, filename: string) {
    return getStaticUrl(`/projects/${this.id}/${type}/${filename}`);
  }

  thumb(type: string, filename: string) {
    const split = filename.split('.');
    if (split.length > 1) {
      split.pop();
      split.push('thumb', 'jpg');
    }
    return getStaticUrl(`/projects/${this.id}/${type}/${split.join('.')}`);
  }

  onPromptDone(outputFilenames: string[]) {
    this.outputFilenames = outputFilenames;
    this.allOutputs.push(...outputFilenames);
  }
}
