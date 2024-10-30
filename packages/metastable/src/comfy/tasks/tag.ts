import path from 'path';

import {
  ModelType,
  ProjectTaggingSettings,
  ProjectTaskData,
  TaskState,
} from '@metastable/types';

import { ProjectEntity } from '../../data/project.js';
import { Metastable } from '../../index.js';
import { BaseTask } from '../../tasks/task.js';

export class TagTask extends BaseTask<ProjectTaskData> {
  constructor(
    private metastable: Metastable,
    private project: ProjectEntity,
    private settings: ProjectTaggingSettings,
  ) {
    super('tag', { projectId: project.id });
    this.created();
  }

  async init() {
    if (!this.settings.tagger.path) {
      const model = await this.metastable.model.getByName(
        ModelType.TAGGER,
        this.settings.tagger.name,
      );
      this.settings.tagger.path = model.path;
    }

    return { projectId: this.project.id };
  }

  async execute() {
    await this.metastable.comfy!.session(async ctx => {
      ctx.on('progress', e => {
        this.progress = e.value / e.max;
      });

      const images = this.settings.inputs.map(input =>
        path.join(this.project.files.input.path, input),
      );
      const threshold = this.settings.threshold || 0.35;
      const result = await ctx.tag.run(
        this.settings.tagger.path!,
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
