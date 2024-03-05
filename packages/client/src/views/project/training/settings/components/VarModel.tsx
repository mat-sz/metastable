import { IVarBaseInputProps, VarBase, useVarUIValue } from 'react-var-ui';
import { ModelType } from '@metastable/types';

import { useUI } from '$components/ui';
import { ModelSelect } from '$modals/modelSelect';
import { useSimpleProject } from '../../../context';

interface IVarModelProps extends IVarBaseInputProps<string> {
  modelType: ModelType;
}

export const VarModel = ({
  path,
  value,
  onChange,
  disabled,
  readOnly,
  className,
  error,
  errorPath,
  modelType,
}: IVarModelProps): JSX.Element => {
  const { showModal } = useUI();
  const project = useSimpleProject();
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });

  return (
    <VarBase
      label="Model"
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      error={currentError}
    >
      <span className="react-var-ui-button">
        <button
          onClick={() => {
            showModal(
              <ModelSelect
                type={modelType}
                onSelect={model => {
                  setCurrentValue(model.file.name);

                  if (model.samplerSettings) {
                    project.settings.sampler = {
                      ...project.settings.sampler,
                      ...model.samplerSettings,
                    };
                  }
                }}
              />,
            );
          }}
        >
          {currentValue || '(none)'}
        </button>
      </span>
    </VarBase>
  );
};
