import { PathInput } from '$components/pathInput';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';

export const VarPath = ({
  path,
  value,
  onChange,
  error,
  errorPath,
  ...props
}: IVarBaseInputProps<string>): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });

  return (
    <VarBase {...props} column error={currentError}>
      <PathInput value={currentValue} onChange={setCurrentValue} />
    </VarBase>
  );
};
