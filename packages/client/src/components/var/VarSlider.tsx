import { useCallback, useEffect, useMemo, useRef } from 'react';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { usePointerDrag } from 'react-use-pointer-drag';

import { Number } from './common/Number';
import { roundValue } from './common/roundValue';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarSlider.module.scss';

export interface IVarSliderProps extends IVarBaseInputProps<number> {
  /**
   * Minimum value.
   */
  min: number;

  /**
   * Maximum value.
   */
  max: number;

  /**
   * Step.
   */
  step: number;

  /**
   * Minimum value (for the input field, if not defined, will use `min`).
   */
  inputMin?: number;

  /**
   * Maximum value (for the input field, if not defined, will use `max`).
   */
  inputMax?: number;

  /**
   * Step (for the input field, if not defined, will use `step`).
   */
  inputStep?: number;

  /**
   * Should the end result be rounded to an integer value.
   */
  integer?: boolean;

  /**
   * If true will display an editable input, otherwise shows a read only value.
   */
  showInput?: boolean;

  /**
   * If true will display buttons that increase and decrease the value by step.
   */
  showButtons?: boolean;

  /**
   * Unit to display to the right of the input field.
   */
  unit?: string;
}

/**
 * Integer/float slider component. Accepts and provides numbers.
 */
export const VarSlider = ({
  label,
  path,
  value,
  onChange,
  min,
  max,
  step,
  inputMin = min,
  inputMax = max,
  inputStep = step,
  integer,
  defaultValue,
  showInput,
  showButtons,
  disabled,
  readOnly,
  className,
  error,
  errorPath,
  unit,
}: IVarSliderProps): JSX.Element => {
  const sliderRef = useRef<HTMLDivElement>(null);
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
  const roundInput = useCallback(
    (value: number) =>
      roundValue(value, inputMin, inputMax, inputStep, !!integer),
    [inputMin, inputMax, inputStep, integer],
  );
  const rounded = useMemo(() => round(currentValue), [currentValue, round]);
  const percent = useMemo(
    () => ((rounded - min) / (max - min)) * 100,
    [rounded, min, max],
  );

  const setValue = useCallback(
    (value: number) => {
      setCurrentValue(round(value));
    },
    [round, setCurrentValue],
  );

  const setValueInput = useCallback(
    (value: number) => {
      setCurrentValue(roundInput(value));
    },
    [roundInput, setCurrentValue],
  );

  const updatePosition = useCallback(
    (x: number) => {
      const div = sliderRef.current!;
      const rect = div.getBoundingClientRect();
      const percent = (x - rect.left) / rect.width;
      setValue(min + (max - min) * percent);
    },
    [setValue, min, max],
  );

  const { dragProps } = usePointerDrag({
    onMove: ({ x }) => updatePosition(x),
  });

  useEffect(() => {
    sliderRef.current?.addEventListener('wheel', e => e.preventDefault());
  }, []);

  return (
    <VarBase
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      error={currentError}
    >
      <div className={styles.slider}>
        <div
          className={styles.wrapper}
          ref={sliderRef}
          onClick={e => updatePosition(e.clientX)}
          onDoubleClick={() =>
            typeof defaultValue !== 'undefined' && setValue(defaultValue)
          }
          onWheel={e => setValue(currentValue - step * Math.sign(e.deltaY))}
          title="Slider"
          style={{ '--fill': percent + '%' } as any}
          {...dragProps()}
        >
          <div className={styles.track} />
          <div className={styles.fill} />
          <div className={styles.thumb} />
        </div>
        {showInput ? (
          <Number
            className={styles.input}
            round={round}
            min={inputMin}
            max={inputMax}
            step={inputStep}
            disabled={disabled}
            readOnly={readOnly}
            onChange={setValueInput}
            value={currentValue}
            unit={unit}
          />
        ) : (
          <span>
            {rounded.toString()}
            {unit}
          </span>
        )}
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
