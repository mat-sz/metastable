import { useCallback, useMemo } from 'react';
import { BsDice5Fill, BsLockFill } from 'react-icons/bs';

import { Switch, SwitchOption } from '$components/switch';
import { randomSeed } from '$utils/comfy';
import { Number } from './common/Number';
import { roundValue } from './common/roundValue';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarRandomNumber.module.scss';

export interface IVarRandomNumberProps extends IVarBaseInputProps<number> {
  /**
   * Minimum value.
   */
  min?: number;

  /**
   * Maximum value.
   */
  max?: number;

  /**
   * Step.
   */
  step?: number;

  isRandomizedPath?: string;
}

/**
 * Integer/float number component. Accepts and provides numbers.
 */
export const VarRandomNumber = ({
  label,
  path,
  isRandomizedPath,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  readOnly,
  className,
  error,
  errorPath,
}: IVarRandomNumberProps): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });
  const [isRandomized, setIsRandomized] = useVarUIValue({
    path: isRandomizedPath,
    fallbackValue: true,
  });
  const round = useCallback(
    (value: number) => roundValue(value, min, max, step, true),
    [min, max, step],
  );
  const rounded = useMemo(() => round(currentValue), [currentValue, round]);

  const setValue = useCallback(
    (value: number) => {
      value = round(value);
      setCurrentValue(value);
    },
    [round, setCurrentValue],
  );

  return (
    <VarBase
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      error={currentError}
    >
      <div className={styles.wrapper}>
        <Number
          round={round}
          min={min}
          max={max}
          step={step}
          value={rounded}
          disabled={disabled}
          readOnly={isRandomized}
          onChange={setValue}
          className={styles.number}
        />
        <Switch
          value={isRandomized ? 'random' : 'lock'}
          onChange={value => {
            const isRandomized = value === 'random';
            setIsRandomized(isRandomized);
            if (isRandomized) {
              setCurrentValue(randomSeed());
            }
          }}
        >
          <SwitchOption value="random">
            <BsDice5Fill />
          </SwitchOption>
          <SwitchOption value="lock">
            <BsLockFill />
          </SwitchOption>
        </Switch>
      </div>
    </VarBase>
  );
};
