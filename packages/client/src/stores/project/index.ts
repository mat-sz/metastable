import { Project as APIProject } from '@metastable/types';

import { BaseProject } from './base';
import { SimpleProject } from './simple';
import { TrainingProject } from './training';

export function createProject(data: APIProject, settings?: any) {
  switch (data.type) {
    case 'training':
      return new TrainingProject(data, settings);
    default:
      return new SimpleProject(data, settings);
  }
}

export type { BaseProject, SimpleProject, TrainingProject };
