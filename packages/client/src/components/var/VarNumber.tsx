import { useCallback, useMemo } from 'react';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';

import { Number } from './common/Number';
import { roundValue } from './common/roundValue';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarNumber.module.scss';

export interface IVarNumberProps extends IVarBaseInputProps<number> {
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

  /**
   * Should the end result be rounded to an integer value.
   */
  integer?: boolean;

  /**
   * If true will display buttons that increase and decrease the value by step.
   * Step must be set.
   */
  showButtons?: boolean;

  /**
   * Unit to display to the right of the input field.
   */
  unit?: string;
}

/**
 * Integer/float number component. Accepts and provides numbers.
 */
export const VarNumber = ({
  label,
  path,
  value,
  onChange,
  min,
  max,
  step = 1,
  integer,
  showButtons,
  disabled,
  readOnly,
  className,
  error,
  errorPath,
  unit,
  inline,
}: IVarNumberProps): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });
  const round = useCallback(
    (value: number) => roundValue(value, min, max, step, !!integer),
    [min, max, step, integer],
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
      inline={inline}
    >
      <div className={styles.number}>
        <Number
          className={styles.input}
          round={round}
          min={min}
          max={max}
          step={step}
          value={rounded}
          disabled={disabled}
          readOnly={readOnly}
          onChange={setValue}
          unit={unit}
        />
        {showButtons && (
          <>
            <button
              title="Increase"
              onClick={() => setValue(currentValue + step)}
              disabled={disabled || readOnly}
            >
              <BsChevronUp />
            </button>
            <button
              title="Decrease"
              onClick={() => setValue(currentValue - step)}
              disabled={disabled || readOnly}
            >
              <BsChevronDown />
            </button>
          </>
        )}
      </div>
    </VarBase>
  );
};
