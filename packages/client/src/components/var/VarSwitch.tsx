import { useMemo } from 'react';

import { Switch, SwitchOption } from '$components/switch';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';

export interface IVarSwitchOption {
  /**
   * Key for the option. Also used as value if `value` is not specified.
   */
  key: string | number;

  /**
   * Option label.
   */
  label: React.ReactNode;

  /**
   * Option value. Key will be used if not specified.
   * Note: Will be serialized to JSON and deserialized when selected.
   */
  value?: any;
}

export interface IVarSwitchProps extends IVarBaseInputProps<any> {
  /**
   * Options to be displayed.
   */
  options: IVarSwitchOption[];

  switchClassName?: string;
}

/**
 * Select component. Returns and accepts either `value` from option object or `key` when `value` is not provided.
 */
export const VarSwitch = ({
  label,
  path,
  value,
  onChange,
  options,
  disabled,
  readOnly,
  className,
  switchClassName,
  error,
  errorPath,
}: IVarSwitchProps): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });

  const serializedCurrentValue = useMemo(
    () => JSON.stringify(currentValue),
    [currentValue],
  );

  return (
    <VarBase
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      error={currentError}
    >
      <Switch
        className={switchClassName}
        value={serializedCurrentValue}
        onChange={value => setCurrentValue(JSON.parse(value))}
      >
        {options.map(option => {
          const serializedValue = JSON.stringify(option.value ?? option.key);

          return (
            <SwitchOption key={option.key} value={serializedValue}>
              {option.label}
            </SwitchOption>
          );
        })}
      </Switch>
    </VarBase>
  );
};
