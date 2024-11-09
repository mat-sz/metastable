import path from 'path';

import { ProjectTaggingSettings } from '@metastable/types';

import { Metastable } from '#metastable';
import { BaseComfyTask, BaseComfyTaskHandlers } from './base.js';
import { ProjectEntity } from '../../data/project.js';

export class TagTask extends BaseComfyTask<
  BaseComfyTaskHandlers,
  ProjectTaggingSettings
> {
  constructor(project: ProjectEntity, settings: ProjectTaggingSettings) {
    super('tag', project, settings);
    this.created();
  }

  async init() {
    return { projectId: this.project.id };
  }

  async process() {
    const ctx = this.session!;
    const images = this.settings.inputs.map(input =>
      path.join(this.project.files.input.path, input),
    );
    const threshold = this.settings.threshold || 0.35;
    const result = await ctx.tag.run(
      await Metastable.instance.resolve(this.settings.tagger),
      images,
      threshold,
      threshold,
      this.settings.removeUnderscore,
    );

    for (const [imagePath, caption] of Object.entries(result)) {
      try {
        const input = await this.project.files.input.get(
          path.basename(imagePath),
        );
        await input.metadata.update({ caption });
      } catch {}
    }
  }
}
