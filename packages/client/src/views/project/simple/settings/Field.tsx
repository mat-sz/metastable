import { Field, FieldType } from '@metastable/types';

import {
  VarCategory,
  VarImageMode,
  VarNumber,
  VarScope,
  VarSlider,
  VarToggle,
} from '$components/var';
import { SettingsCategory } from '../common/SettingsCategory';
import { VarProjectImage } from '../common/VarProjectImage';
import { VarProjectModel } from '../common/VarProjectModel';

interface SettingsFieldProps {
  id: string;
  isRoot?: boolean;
  field: Field;
}

export const SettingsField: React.FC<SettingsFieldProps> = ({
  id,
  isRoot = false,
  field,
}) => {
  switch (field.type) {
    case FieldType.CATEGORY: {
      const children = (
        <VarScope path={id}>
          {!!field.enabledKey && <VarToggle label="Enable" path="enabled" />}
          {Object.entries(field.properties).map(([key, value]) => (
            <SettingsField id={key} key={key} field={value} />
          ))}
        </VarScope>
      );

      if (isRoot) {
        return (
          <SettingsCategory label={field.label} sectionId={id}>
            {children}
          </SettingsCategory>
        );
      } else {
        return <VarCategory label={field.label}>{children}</VarCategory>;
      }
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
