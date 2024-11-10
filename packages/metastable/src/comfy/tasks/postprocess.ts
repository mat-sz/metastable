import fs from 'fs/promises';
import path from 'path';

import { ImageFile, PostprocessSettings } from '@metastable/types';

import { BaseComfyTask, BaseComfyTaskHandlers } from './base.js';
import { ProjectEntity } from '../../data/project.js';
import { getNextFilename } from '../../helpers/fs.js';
import type { ComfySession } from '../session/index.js';
import { RPCRef } from '../session/types.js';

type PostprocessTaskHandlers = BaseComfyTaskHandlers & {
  postprocess: () => Promise<void> | void;
};

export class PostprocessTask extends BaseComfyTask<
  PostprocessTaskHandlers,
  PostprocessSettings
> {
  public session?: ComfySession;
  public images?: RPCRef[];

  constructor(project: ProjectEntity, settings: PostprocessSettings) {
    super('postprocess', project, settings);
  }

  async init() {
    const settings = this.settings;

    if (!settings.input.image) {
      throw new Error('Input image is required.');
    }

    return await super.init();
  }

  protected async process() {
    const ctx = this.session!;

    const settings = this.settings;

    const { image } = await this.loadInputRaw(settings.input.image);
    this.images = [image];
    const outputDir = this.project!.files.output.path;

    await this.executeHandlers('postprocess');

    this.step('save');
    const ext = settings.output?.format || 'png';
    const outputs: ImageFile[] = [];

    for (const image of this.images) {
      const bytes = await ctx.image.dump(image, ext);
      const buffer: Uint8Array = Buffer.from(bytes.$bytes, 'base64');

      const filename = await getNextFilename(outputDir, ext);
      await fs.writeFile(path.join(outputDir, filename), buffer);
      const output = await this.project!.files.output.get(filename);
      await output.metadata.set(settings);
      outputs.push(await output.json());
    }

    this.data = {
      ...this.data,
      outputs,
    };
  }
}
