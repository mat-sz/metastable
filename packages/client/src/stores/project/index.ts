import { Project as APIProject } from '@metastable/types';

import { BaseProject } from './base';
import { SimpleProject } from './simple';
import { TrainingProject } from './training';

export function createProject(data: APIProject) {
  switch (data.type) {
    case 'training':
      return new TrainingProject(data);
    default:
      return new SimpleProject(data);
  }
}

export type { BaseProject, SimpleProject, TrainingProject };
