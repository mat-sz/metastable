import { FieldProperties } from './field.js';

export interface Feature {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  fields?: FieldProperties;
  installed: boolean;
  enabled: boolean;
}
