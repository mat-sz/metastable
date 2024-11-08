import { Field, FieldModel, FieldType } from '@metastable/types';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import {
  VarAddModel,
  VarArray,
  VarButton,
  VarCategory,
  VarImage,
  VarImageMode,
  VarModel,
  VarNumber,
  VarScope,
  VarSlider,
  VarToggle,
} from '$components/var';
import { useFieldContext } from './context';

interface FieldRendererProps {
  id?: string;
  isRoot?: boolean;
  field: Field;
  labelSuffix?: React.ReactNode;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  id,
  isRoot = false,
  field,
  labelSuffix,
}) => {
  const { architecture, imageFiles, collapsed, onToggleCollapsed } =
    useFieldContext();

  switch (field.type) {
    case FieldType.SECTION:
    case FieldType.SCOPE: {
      const scopeChildren = Object.entries(field.properties).map(
        ([key, value]) => <FieldRenderer id={key} key={key} field={value} />,
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
            <FieldRenderer id={key} key={key} field={value} />
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

      let isCollapsed: boolean | undefined = undefined;
      let toggleCollapsed: (() => void) | undefined = undefined;

      if (id && isRoot) {
        isCollapsed = collapsed?.[id];
        toggleCollapsed = () => {
          onToggleCollapsed?.(id, !isCollapsed);
        };
      }

      return (
        <VarCategory
          label={label}
          collapsed={isCollapsed}
          onToggleCollapsed={toggleCollapsed}
        >
          {children}
        </VarCategory>
      );
    }
    case FieldType.ARRAY: {
      const { itemType } = field;
      const modelField =
        itemType.type === FieldType.CATEGORY &&
        itemType.properties['model']?.type === FieldType.MODEL
          ? (itemType.properties['model'] as FieldModel)
          : undefined;

      const newObj = {} as any;
      if (itemType.type === FieldType.CATEGORY && itemType.enabledKey) {
        newObj[itemType.enabledKey] = true;
      }

      return (
        <>
          <VarArray
            path={id}
            footer={({ append }) => (
              <>
                {modelField ? (
                  <VarAddModel
                    label={field.label}
                    modelType={modelField.modelType}
                    architecture={
                      modelField.shouldFilterByArchitecture
                        ? architecture
                        : undefined
                    }
                    onSelect={model => {
                      append({ ...newObj, model: model.mrn });
                    }}
                  />
                ) : (
                  <VarButton
                    buttonLabel={`Add ${field.label}`}
                    onClick={() => {
                      append({ ...newObj });
                    }}
                  />
                )}
              </>
            )}
          >
            {({ remove }) => (
              <FieldRenderer
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
          showInput
        />
      );
    case FieldType.MODEL:
      return (
        <VarModel
          label={field.label}
          path={id}
          modelType={field.modelType}
          architecture={
            field.shouldFilterByArchitecture ? architecture : undefined
          }
        />
      );
    case FieldType.IMAGE:
      return (
        <>
          <VarImage
            label={field.label}
            path={id}
            imageBrowserProps={
              imageFiles
                ? {
                    files: imageFiles,
                    showBreadcrumbs: true,
                    defaultParts: ['input'],
                  }
                : undefined
            }
          />
          {!!field.modeKey && (
            <VarImageMode label="Image mode" path={field.modeKey} />
          )}
        </>
      );
  }

  return null;
};
