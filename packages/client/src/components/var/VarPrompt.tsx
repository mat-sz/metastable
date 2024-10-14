import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

import { deleteText, getCurrentLineIndex, replaceText } from '$utils/input';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarPrompt.module.scss';

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
    setCurrentLine(getCurrentLineIndex(textareaRef.current));
  }, [setCurrentLine]);

  useEffect(() => {
    document.addEventListener('selectionchange', updateCurrentLine);

    return () => {
      document.removeEventListener('selectionchange', updateCurrentLine);
    };
  }, [updateCurrentLine]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const textStart = el.selectionStart;
    const textEnd = el.selectionEnd;

    if (e.shiftKey && e.key === '(') {
      e.stopPropagation();
      e.preventDefault();

      const text = el.value.substring(textStart, textEnd);
      replaceText(el, textStart, textEnd, `(${text})`);
    }

    if (e.key === 'Backspace') {
      if (
        textStart === textEnd &&
        el.value[textStart - 1] === '(' &&
        el.value[textStart] === ')'
      ) {
        e.stopPropagation();
        e.preventDefault();

        deleteText(el, textStart - 1, textStart + 1);
      }
    }
  };

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
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </VarBase>
  );
};
