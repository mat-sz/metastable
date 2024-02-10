import { Project as APIProject, ProjectSettings } from '@metastable/types';

import { BaseProject } from './base';
import { SimpleProject } from './simple';

export function createProject(data: APIProject, settings?: ProjectSettings) {
  switch (data.type) {
    default:
      return new SimpleProject(data, settings);
  }
}

export type { BaseProject, SimpleProject };
