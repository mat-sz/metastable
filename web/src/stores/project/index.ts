import { makeAutoObservable, toJS } from 'mobx';
import { getUrl } from '../../config';
import { imageUrlToBase64, randomSeed } from '../../helpers';
import { ProjectSettings } from '../../types/project';
import { httpGet, httpPost } from '../../http';
import { Editor } from '../../views/project/editor/src';
import { Point } from '../../views/project/editor/src/types';

async function base64ify(image: string) {
  if (image.startsWith('blob:')) {
    return await imageUrlToBase64(image);
  } else if (image.startsWith('data:')) {
    return image.split(',')[1];
  }

  return image;
}

export class Project {
  outputFilenames: string[] = [];
  allOutputs: string[] = [];
  editor = new Editor();
  addOutputToEditor: Point | undefined = undefined;

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

    const settings = toJS(this.settings);
    if (
      settings.input.mode === 'image' ||
      settings.input.mode === 'image_masked'
    ) {
      settings.input.image = await base64ify(settings.input.image);
    }

    if (settings.models.controlnets) {
      for (const controlnet of settings.models.controlnets) {
        controlnet.image = await base64ify(controlnet.image);
      }
    }

    this.save();
    await httpPost(`/prompts`, {
      project_id: this.id,
      ...settings,
    });
  }

  async rename(name: string) {
    this.name = name;
    await httpPost(`/projects/${this.id}`, {
      name,
    });
  }

  async save() {
    const settings = toJS(this.settings);

    await httpPost(`/projects/${this.id}`, {
      settings: JSON.stringify(settings),
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
    this._autosaveTimeout = setTimeout(() => this.save(), 5000) as any;
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

  addControlnet(name: string, strength = 1) {
    const settings = { ...this.settings };

    settings.models.controlnets.push({
      name,
      strength,
      image: '',
    });
    this.settings = settings;
  }

  onPromptDone(outputFilenames: string[]) {
    this.outputFilenames = outputFilenames;
    this.allOutputs.push(...outputFilenames);

    if (this.addOutputToEditor) {
      this.editor.addImage(this.view('output', outputFilenames[0]), {
        name: `Output (${outputFilenames[0]})`,
        offset: toJS(this.addOutputToEditor),
      });
      this.addOutputToEditor = undefined;
    }
  }
}
