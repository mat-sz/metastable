import { IVarBaseInputProps, VarBase, useVarUIValue } from 'react-var-ui';

import { ModelSelect } from '../../../../modals/modelSelect';
import { useUI } from '../../../../contexts/ui';

interface IVarModelProps extends IVarBaseInputProps<string> {
  modelType: string;
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
              <ModelSelect type={modelType} onSelect={setCurrentValue} />,
            );
          }}
        >
          {currentValue || '(none)'}
        </button>
      </span>
    </VarBase>
  );
};
