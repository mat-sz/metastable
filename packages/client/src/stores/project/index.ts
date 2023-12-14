import { makeAutoObservable, toJS } from 'mobx';
import { ProjectSettings } from '@metastable/types';

import { getUrl } from '../../config';
import { imageUrlToBase64, loadImage, randomSeed } from '../../helpers';
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

async function prepareImage(
  input: string,
  width: number,
  height: number,
  mode?: 'cover' | 'contain' | 'center' | 'stretch' | string,
) {
  const source = await loadImage(input);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (mode === 'cover' || mode === 'contain') {
    let scale = 1;
    let imageHeight = 0;
    let imageWidth = 0;
    let x = 0;
    let y = 0;

    let cond = source.naturalWidth > source.naturalHeight;
    if (mode === 'contain') {
      cond = !cond;
    }

    if (cond) {
      scale = height / source.naturalHeight;
      imageWidth = source.naturalWidth * scale;
      imageHeight = height;
      x = (-1 * (imageWidth - height)) / 2;
    } else {
      scale = width / source.naturalWidth;
      imageWidth = width;
      imageHeight = source.naturalHeight * scale;
      y = (-1 * (imageHeight - width)) / 2;
    }
    ctx.drawImage(source, x, y, imageWidth, imageHeight);
  } else if (mode === 'center') {
    const x = width / 2 - source.naturalWidth / 2;
    const y = height / 2 - source.naturalHeight / 2;
    ctx.drawImage(source, x, y, source.naturalWidth, source.naturalHeight);
  } else {
    ctx.drawImage(
      source,
      0,
      0,
      source.naturalWidth,
      source.naturalHeight,
      0,
      0,
      width,
      height,
    );
  }

  return canvas.toDataURL('image/png');
}

export class Project {
  outputFilenames: string[] = [];
  allOutputs: string[] = [];
  editor = new Editor();
  addOutputToEditor: Point | undefined = undefined;
  mode: string = 'images';

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

  removeLora(index: number) {
    const settings = { ...this.settings };
    settings.models.loras.splice(index, 1);
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

  removeControlnet(index: number) {
    const settings = { ...this.settings };
    settings.models.controlnets.splice(index, 1);
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
