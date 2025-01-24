import { lexPrompt, PromptTokenType } from '@metastable/common';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';

import { useEventListener } from '$hooks/useEventListener';
import { matchHotkey } from '$hooks/useHotkey';
import {
  deleteText,
  getCurrentLineIndex,
  getLineStart,
  replaceText,
} from '$utils/input';
import {
  findClosestTokenOrImportance,
  parseImportance,
  serializeImportance,
} from '$utils/prompt';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarPrompt.module.scss';

function getTokens(str: string) {
  const tokens = lexPrompt(str);
  return tokens.map(token => {
    let className = undefined;

    switch (token.type) {
      case PromptTokenType.COMMENT:
        className = styles.comment;
        break;
      case PromptTokenType.LPAREN:
      case PromptTokenType.RPAREN:
        className = styles.paren;
        break;
      case PromptTokenType.LBRACKET:
      case PromptTokenType.RBRACKET:
        className = styles.paren;
        break;
      case PromptTokenType.WEIGHT:
      case PromptTokenType.PIPE:
        className = styles.weight;
        break;
    }

    return {
      value: token.value,
      className,
    };
  });
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
    fallbackValue: value || '',
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

  useEventListener('selectionchange', updateCurrentLine);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const textStart = el.selectionStart;
    const textEnd = el.selectionEnd;

    if (
      e.key === '(' &&
      (el.value[textStart] === ' ' || !el.value[textStart])
    ) {
      e.stopPropagation();
      e.preventDefault();

      const text = el.value.substring(textStart, textEnd);
      replaceText(el, textStart, textEnd, `(${text})`);
      return;
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
      return;
    }

    const hotkeyId = matchHotkey(e, 'prompt');
    if (!hotkeyId) {
      return;
    }

    switch (hotkeyId) {
      case 'weightIncrease':
      case 'weightDecrease':
        {
          e.stopPropagation();
          e.preventDefault();

          const change = hotkeyId === 'weightIncrease' ? 0.05 : -0.05;
          const result = findClosestTokenOrImportance(
            el.value,
            textStart,
            textEnd,
          );
          if (!result) {
            break;
          }

          const parsed = parseImportance(result.text);
          const replaceWith = serializeImportance(
            parsed.text,
            parsed.weight + change,
          );

          replaceText(el, result.start, result.end, replaceWith);
        }
        break;
      case 'comment':
        {
          e.stopPropagation();
          e.preventDefault();

          const lineIndex = getCurrentLineIndex(el);
          if (lineIndex) {
            const start = getLineStart(el, lineIndex);
            let replaceLength = 0;
            let replaceWith = '# ';

            if (el.value[start] === '#') {
              replaceWith = '';
              replaceLength = el.value[start + 1] === ' ' ? 2 : 1;
            }

            replaceText(el, start, start + replaceLength, replaceWith);

            const offset = -replaceLength || 2;
            el.setSelectionRange(textStart + offset, textEnd + offset);
          } else {
            const text = el.value.substring(textStart, textEnd);
            const isComment = text.startsWith('#-') && text.endsWith('-#');
            const replaceWith = isComment
              ? text.replace(/^#-\s?/, '').replace(/\s?-#$/, '')
              : `#- ${text} -#`;
            replaceText(el, textStart, textEnd, replaceWith);
          }
        }
        break;
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
              <span key={i} className={token.className}>
                {token.value}
              </span>
            ))}
          </pre>
        </div>
      </div>
    </VarBase>
  );
};
