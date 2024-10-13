import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarPrompt.module.scss';

function getLineIdx(element: HTMLTextAreaElement, charIdx: number) {
  return element.value.substring(0, charIdx).split('\n').length - 1;
}

export const VarPrompt = ({
  label,
  path,
  value,
  onChange,
  disabled,
  readOnly,
  className,
  error,
  errorPath,
}: IVarBaseInputProps<string>): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentLine, setCurrentLine] = useState<number>();
  const lines = currentValue.split('\n');

  const updateCurrentLine = useCallback(() => {
    const el = textareaRef.current;
    if (!el) {
      setCurrentLine(undefined);
      return;
    }

    const startLineIdx = getLineIdx(el, el.selectionStart);
    const endLineIdx = getLineIdx(el, el.selectionEnd);
    if (startLineIdx === endLineIdx) {
      setCurrentLine(startLineIdx);
    } else {
      setCurrentLine(undefined);
    }
  }, [setCurrentLine]);

  useEffect(() => {
    document.addEventListener('selectionchange', updateCurrentLine);

    return () => {
      document.removeEventListener('selectionchange', updateCurrentLine);
    };
  }, [updateCurrentLine]);

  return (
    <VarBase
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      error={currentError}
    >
      <div className={styles.wrapper}>
        <div className={styles.lines}>
          {lines.map((line, i) => (
            <div
              key={i}
              className={clsx(styles.line, {
                [styles.active]: currentLine === i,
              })}
            >
              <div className={styles.number}>{i + 1}</div>
              <div className={styles.text}>{line}</div>
            </div>
          ))}
          <textarea
            className={styles.input}
            value={currentValue}
            onChange={e => setCurrentValue(e.target.value)}
            ref={textareaRef}
            onPointerMove={updateCurrentLine}
            onSelect={updateCurrentLine}
            spellCheck={false}
          />
        </div>
      </div>
    </VarBase>
  );
};
