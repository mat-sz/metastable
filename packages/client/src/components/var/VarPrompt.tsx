import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

import { deleteText, getCurrentLineIndex, replaceText } from '$utils/input';
import {
  findClosestTokenOrImportance,
  parseImportance,
  serializeImportance,
} from '$utils/prompt';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarPrompt.module.scss';

interface HighlightToken {
  text: string;
  type: string;
}

function getTokens(str: string) {
  const tokens: HighlightToken[] = [];
  let text = '';
  let type = 'text';

  function next(newType: string) {
    tokens.push({ text, type });
    text = '';
    type = newType;
  }

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    switch (char) {
      case '#':
        next('comment');
        break;
      case '(':
      case ')':
        next('paren');
        break;
      default: {
        if (char === '\n' && type === 'comment') {
          next('text');
        } else if (type === 'paren') {
          next('text');
        }
      }
    }

    text += char;
  }
  tokens.push({ text, type });

  return tokens;
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

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.stopPropagation();
        e.preventDefault();

        const change = e.key === 'ArrowUp' ? 0.05 : -0.05;
        const result = findClosestTokenOrImportance(
          el.value,
          textStart,
          textEnd,
        );
        if (!result) {
          return;
        }

        const parsed = parseImportance(result.text);
        const replaceWith = serializeImportance(
          parsed.text,
          parsed.weight + change,
        );

        replaceText(el, result.start, result.end, replaceWith);
      }
    }

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

  const tokens = getTokens(currentValue);
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
          <pre className={styles.highlighted}>
            {tokens.map((token, i) => (
              <span key={i} className={styles[token.type]}>
                {token.text}
              </span>
            ))}
          </pre>
        </div>
      </div>
    </VarBase>
  );
};
