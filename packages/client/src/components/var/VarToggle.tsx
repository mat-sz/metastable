import { Toggle } from '$components/toggle';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';

/**
 * Checkbox/toggle component. Accepts and returns a boolean (true/false).
 */
export const VarToggle = ({
  label,
  path,
  value,
  onChange,
  disabled,
  readOnly,
  className,
  error,
  errorPath,
}: IVarBaseInputProps<boolean>): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });

  return (
    <VarBase
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      error={currentError}
      inline
    >
      <span>
        <Toggle value={currentValue} onChange={setCurrentValue} />
      </span>
    </VarBase>
  );
};
