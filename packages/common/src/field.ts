import { Feature, Field, FieldProperties, FieldType } from '@metastable/types';

export type FieldHandler = (parent: any, key: string, field: Field) => void;

function recurseField(
  parent: any,
  key: string,
  current: Field,
  onField: FieldHandler,
) {
  switch (current.type) {
    case FieldType.CATEGORY:
      {
        const isEnabled =
          !current.enabledKey || parent?.[key]?.[current.enabledKey];
        if (isEnabled) {
          for (const [fieldKey, field] of Object.entries(current.properties)) {
            recurseField(parent?.[key], fieldKey, field, onField);
          }
        }
      }
      break;
    case FieldType.SCOPE:
    case FieldType.SECTION:
      for (const [fieldKey, field] of Object.entries(current.properties)) {
        recurseField(parent?.[key], fieldKey, field, onField);
      }
      break;
    case FieldType.ARRAY:
      {
        const array = parent?.[key] as any[];
        if (array && Array.isArray(array)) {
          for (let i = 0; i < array.length; i++) {
            recurseField(array, `${i}`, current.itemType, onField);
          }
        }
      }
      break;
    default:
      onField(parent, key, current);
  }
}

export function recurseFields(
  object: any,
  fields: FieldProperties,
  onField: FieldHandler,
) {
  for (const [key, field] of Object.entries(fields)) {
    recurseField(object, key, field, onField);
  }
}

export function joinFields(features: Feature[]) {
  const result: FieldProperties = {} as any;

  for (const feature of features) {
    if (!feature.enabled) {
      continue;
    }

    if (feature.fields) {
      for (const [key, value] of Object.entries(feature.fields)) {
        result[key] = value;
      }
    }
  }

  return result;
}

export function setDefaultValues(object: any, fields: FieldProperties) {
  recurseFields(object, fields, (parent, key, field) => {
    const defaultValue = (field as any).defaultValue;
    if (defaultValue) {
      parent[key] ??= defaultValue;
    }
  });
}
