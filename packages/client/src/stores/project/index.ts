import { Project as APIProject } from '@metastable/types';

import { BaseProject } from './base';
import { SimpleProject } from './simple';

export function createProject(data: APIProject) {
  switch (data.type) {
    default:
      return new SimpleProject(data);
  }
}

export type { BaseProject, SimpleProject };
