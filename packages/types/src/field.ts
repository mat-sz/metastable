import { ModelType } from './model.js';

export enum FieldType {
  BOOLEAN,
  FLOAT,
  INTEGER,
  MODEL,
  IMAGE,
  CATEGORY,
  ARRAY,
  SCOPE,
  SECTION,
}

export interface FieldBase {
  type: FieldType;
}

export interface FieldWithLabel extends FieldBase {
  label: string;
}

export interface FieldWithValue<T> extends FieldWithLabel {
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

export interface FieldWithProperties extends FieldBase {
  properties: Record<string, Field>;
}

export interface FieldCategory extends FieldWithLabel, FieldWithProperties {
  type: FieldType.CATEGORY;

  /**
   * Will show a toggle to enable the item if not undefined.
   */
  enabledKey?: string;
}

export interface FieldArray extends FieldWithLabel {
  type: FieldType.ARRAY;
  itemType: Field;
}

export interface FieldScope extends FieldWithProperties {
  type: FieldType.SCOPE;
  properties: Record<string, Field>;
}

export interface FieldSection extends FieldWithLabel, FieldWithProperties {
  type: FieldType.SECTION;
  properties: Record<string, Field>;
}

export type Field =
  | FieldBoolean
  | FieldFloat
  | FieldInteger
  | FieldModel
  | FieldImage
  | FieldCategory
  | FieldArray
  | FieldScope
  | FieldSection;

type FieldPropertiesToType<TField extends FieldWithProperties> = {
  [K in keyof TField['properties']]: FieldToType<TField['properties'][K]>;
};

type FieldCategoryToType<TField extends FieldCategory> =
  TField['enabledKey'] extends string
    ?
        | (Record<TField['enabledKey'], true> & FieldPropertiesToType<TField>)
        | Record<TField['enabledKey'], false>
    : FieldPropertiesToType<TField>;

export type FieldToType<TField extends Field> = TField extends FieldNumber
  ? number
  : TField['type'] extends FieldType.IMAGE | FieldType.MODEL
    ? string
    : TField extends FieldArray
      ? FieldToType<TField['itemType']>[]
      : TField extends FieldCategory
        ? FieldCategoryToType<TField>
        : TField extends FieldWithProperties
          ? FieldPropertiesToType<TField>
          : undefined;
