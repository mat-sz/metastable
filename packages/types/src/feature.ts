import { Field } from './field.js';
import { ProjectType } from './project.js';

export type FeatureProjectFields =
  | { [K in ProjectType]?: Record<string, Field> }
  | undefined;

export interface Feature {
  id: string;
  name: string;
  description?: string;
  projectFields?: FeatureProjectFields;
  installed: boolean;
  enabled: boolean;
}
