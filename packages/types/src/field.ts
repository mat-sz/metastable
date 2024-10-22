import { ModelType } from './model.js';

export enum FieldType {
  BOOLEAN,
  FLOAT,
  INTEGER,
  MODEL,
  IMAGE,
  CATEGORY,
  ARRAY,
}

export interface FieldBase {
  type: FieldType;
  label: string;
}

export interface FieldWithValue<T> extends FieldBase {
  defaultValue?: T;
}

export interface FieldBoolean extends FieldWithValue<boolean> {
  type: FieldType.BOOLEAN;
}

export interface FieldNumber extends FieldWithValue<number> {
  type: FieldType.FLOAT | FieldType.INTEGER;
  min: number;
  max: number;
  step: number;
}

export interface FieldFloat extends FieldNumber {
  type: FieldType.FLOAT;
}

export interface FieldInteger extends FieldNumber {
  type: FieldType.INTEGER;
}

export interface FieldModel extends FieldWithValue<string> {
  type: FieldType.MODEL;
  modelType: ModelType;
  shouldFilterByArchitecture?: boolean;
}

export interface FieldImage extends FieldWithValue<string> {
  type: FieldType.IMAGE;

  /**
   * Will show a switch for image scaling modes.
   * Also: enables image preprocessing (scaling down to project size).
   */
  modeKey?: string;
}

export interface FieldCategory extends FieldBase {
  type: FieldType.CATEGORY;
  properties: Record<string, Field>;

  /**
   * Will show a toggle to enable the item if not undefined.
   */
  enabledKey?: string;
}

export interface FieldArray extends FieldBase {
  type: FieldType.ARRAY;
  items: Field;
}

export type Field =
  | FieldBoolean
  | FieldFloat
  | FieldInteger
  | FieldModel
  | FieldImage
  | FieldCategory
  | FieldArray;
