import path from 'path';

import {
  ProjectTaggingSettings,
  ProjectTaskData,
  TaskState,
} from '@metastable/types';

import { Metastable } from '#metastable';
import { ProjectEntity } from '../../data/project.js';
import { BaseTask } from '../../tasks/task.js';

export class TagTask extends BaseTask<ProjectTaskData> {
  constructor(
    private project: ProjectEntity,
    private settings: ProjectTaggingSettings,
  ) {
    super('tag', { projectId: project.id });
    this.created();
  }

  async init() {
    return { projectId: this.project.id };
  }

  async execute() {
    await Metastable.instance.comfy!.session(async ctx => {
      ctx.on('progress', e => {
        this.progress = e.value / e.max;
      });

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
    });

    return TaskState.SUCCESS;
  }
}
