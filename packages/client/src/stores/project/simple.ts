import { action, makeObservable, observable, toJS } from 'mobx';
import { ProjectSettings, Project as APIProject } from '@metastable/types';

import { randomSeed } from '../../helpers';
import { Editor } from '../../views/project/simple/editor/src';
import { Point } from '../../views/project/simple/editor/src/types';
import { API } from '../../api';
import { base64ify, loadImage, prepareImage } from '../../utils/image';
import { BaseProject } from './base';

export class SimpleProject extends BaseProject {
  editor = new Editor();
  addOutputToEditor: Point | undefined = undefined;

  constructor(data: APIProject, settings: ProjectSettings) {
    super(data, settings);
    makeObservable(this, {
      editor: observable,
      request: action,
      addLora: action,
      addControlnet: action,
      addIPAdapter: action,
      removeLora: action,
      removeControlnet: action,
      removeIPAdapter: action,
      onPromptDone: action,
    });
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

    if (settings.models.ipadapters) {
      for (const ipadapter of settings.models.ipadapters) {
        ipadapter.image = await base64ify(
          await prepareImage(
            ipadapter.image!,
            width,
            height,
            ipadapter.image_mode,
          ),
        );
      }
    }

    this.save();
    await API.prompts.create(this.id, settings);
  }

  addLora(name: string, strength = 1) {
    const settings = { ...this.settings };

    if (!settings.models.loras) {
      settings.models.loras = [];
    }

    settings.models.loras.push({
      enabled: true,
      name,
      strength,
    });
    this.settings = settings;
  }

  removeLora(index: number) {
    const settings = { ...this.settings };
    settings.models.loras?.splice(index, 1);
    this.settings = settings;
  }

  addControlnet(name: string, strength = 1) {
    const settings = { ...this.settings };

    if (!settings.models.controlnets) {
      settings.models.controlnets = [];
    }

    settings.models.controlnets.push({
      enabled: true,
      name,
      strength,
      image: '',
      image_mode: 'cover',
    });
    this.settings = settings;
  }

  removeControlnet(index: number) {
    const settings = { ...this.settings };
    settings.models.controlnets?.splice(index, 1);
    this.settings = settings;
  }

  addIPAdapter() {
    const settings = { ...this.settings };

    if (!settings.models.ipadapters) {
      settings.models.ipadapters = [];
    }

    settings.models.ipadapters.push({
      enabled: true,
      weight: 1,
      image_mode: 'cover',
    });
    this.settings = settings;
  }

  removeIPAdapter(index: number) {
    const settings = { ...this.settings };
    settings.models.ipadapters?.splice(index, 1);
    this.settings = settings;
  }

  onPromptDone(outputFilenames: string[]) {
    super.onPromptDone(outputFilenames);

    if (this.addOutputToEditor) {
      this.editor.addImage(this.view('output', outputFilenames[0]), {
        name: `Output (${outputFilenames[0]})`,
        offset: toJS(this.addOutputToEditor),
      });
      this.addOutputToEditor = undefined;
    }
  }
}
