import { action, makeObservable, observable, toJS } from 'mobx';
import { ProjectSettings, Project as APIProject } from '@metastable/types';

import { API } from '@api';
import { getStaticUrl } from '@utils/url';

export class BaseProject {
  outputFilenames: string[] = [];
  allOutputs: string[] = [];
  mode: string = 'images';
  id;
  name;
  type;

  constructor(
    data: APIProject,
    public settings: ProjectSettings,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.outputFilenames = data.lastOutput ? [data.lastOutput] : [];

    this.refreshOutputs();
    makeObservable(this, {
      outputFilenames: observable,
      allOutputs: observable,
      mode: observable,
      id: observable,
      name: observable,
      type: observable,
      settings: observable,
      rename: action,
      save: action,
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

  async refreshOutputs() {
    const outputs = await API.projects.outputs(this.id);

    if (outputs) {
      this.allOutputs = outputs;
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

  onPromptDone(outputFilenames: string[]) {
    this.outputFilenames = outputFilenames;
    this.allOutputs.push(...outputFilenames);
  }
}
