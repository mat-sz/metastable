import { Field, FieldModel, FieldType } from '@metastable/types';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarImageMode,
  VarNumber,
  VarScope,
  VarSlider,
  VarToggle,
} from '$components/var';
import { SettingsCategory } from '../common/SettingsCategory';
import { VarProjectAddModel } from '../common/VarProjectAddModel';
import { VarProjectImage } from '../common/VarProjectImage';
import { VarProjectModel } from '../common/VarProjectModel';

interface SettingsFieldProps {
  id?: string;
  isRoot?: boolean;
  field: Field;
  labelSuffix?: React.ReactNode;
}

export const SettingsField: React.FC<SettingsFieldProps> = ({
  id,
  isRoot = false,
  field,
  labelSuffix,
}) => {
  switch (field.type) {
    case FieldType.SECTION:
    case FieldType.SCOPE: {
      const scopeChildren = Object.entries(field.properties).map(
        ([key, value]) => <SettingsField id={key} key={key} field={value} />,
      );
      return id ? (
        <VarScope path={id}>{scopeChildren}</VarScope>
      ) : (
        scopeChildren
      );
    }
    case FieldType.CATEGORY: {
      const scopeChildren = (
        <>
          {!!field.enabledKey && <VarToggle label="Enable" path="enabled" />}
          {Object.entries(field.properties).map(([key, value]) => (
            <SettingsField id={key} key={key} field={value} />
          ))}
        </>
      );
      const label = (
        <>
          <span>{field.label}</span>
          {labelSuffix}
        </>
      );
      const children = id ? (
        <VarScope path={id}>{scopeChildren}</VarScope>
      ) : (
        scopeChildren
      );

      if (id && isRoot) {
        return (
          <SettingsCategory label={label} sectionId={id}>
            {children}
          </SettingsCategory>
        );
      } else {
        return <VarCategory label={label}>{children}</VarCategory>;
      }
    }
    case FieldType.ARRAY: {
      const modelField =
        field.itemType.type === FieldType.CATEGORY &&
        field.itemType.properties['model']?.type === FieldType.MODEL
          ? (field.itemType.properties['model'] as FieldModel)
          : undefined;

      return (
        <>
          <VarArray
            path={id}
            footer={({ append }) => (
              <>
                {modelField ? (
                  <VarProjectAddModel
                    label={field.label}
                    modelType={modelField.modelType}
                    shouldFilterByArchitecture={
                      modelField.shouldFilterByArchitecture
                    }
                    onSelect={model => {
                      append({ model: model.mrn });
                    }}
                  />
                ) : (
                  <VarButton
                    buttonLabel={`Add ${field.label}`}
                    onClick={() => {
                      append({});
                    }}
                  />
                )}
              </>
            )}
          >
            {({ remove }) => (
              <SettingsField
                field={field.itemType}
                labelSuffix={
                  <IconButton title="Delete" onClick={remove}>
                    <BsX />
                  </IconButton>
                }
              />
            )}
          </VarArray>
        </>
      );
    }
    case FieldType.BOOLEAN:
      return (
        <VarToggle
          label={field.label}
          path={id}
          defaultValue={field.defaultValue}
        />
      );
    case FieldType.INTEGER:
      return (
        <VarNumber
          label={field.label}
          path={id}
          min={field.min}
          max={field.max}
          step={field.step}
          defaultValue={field.defaultValue}
          inline
        />
      );
    case FieldType.FLOAT:
      return (
        <VarSlider
          label={field.label}
          path={id}
          min={field.min}
          max={field.max}
          step={field.step}
          defaultValue={field.defaultValue}
        />
      );
    case FieldType.MODEL:
      return (
        <VarProjectModel
          label={field.label}
          path={id}
          modelType={field.modelType}
          shouldFilterByArchitecture={field.shouldFilterByArchitecture}
        />
      );
    case FieldType.IMAGE:
      return (
        <>
          <VarProjectImage label={field.label} path={id} />
          {!!field.modeKey && (
            <VarImageMode label="Image mode" path={field.modeKey} />
          )}
        </>
      );
  }

  return null;
};
