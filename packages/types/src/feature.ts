import { FieldProperties } from './field.js';

export interface Feature {
  id: string;
  name: string;
  description?: string;
  type?: string;
  fields?: FieldProperties;
  installed: boolean;
  enabled: boolean;
}
