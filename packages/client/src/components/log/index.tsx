import { LogItem } from '@metastable/types';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { BsClipboard } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { copy } from '$utils/clipboard';
import styles from './index.module.scss';

interface Props {
  items: LogItem[];
  className?: string;
}

export const Log: React.FC<Props> = ({ items, className }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logEl = logRef.current;
    if (!logEl) {
      return;
    }

    logEl.scrollTo({ top: logEl.scrollHeight });
  }, [items]);

  return (
    <div className={clsx(styles.logWrapper, className)}>
      <IconButton
        className={styles.copy}
        onClick={() => {
          copy(
            items
              .map(
                item =>
                  `[${new Date(item.timestamp).toLocaleTimeString()}] ${
                    item.text
                  }`,
              )
              .join('\n'),
          );
        }}
      >
        <BsClipboard />
      </IconButton>
      <div className={clsx(styles.log, styles.advanced)} ref={logRef}>
        {items.map((item, i) => (
          <div
            key={i}
            className={clsx(styles.item, {
              [styles.error]: item.type === 'stderr',
            })}
          >
            <div className={styles.timestamp}>
              [{new Date(item.timestamp).toLocaleTimeString()}]
            </div>
            <div className={styles.text}>{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SimpleProps {
  log: string;
  className?: string;
}

export const LogSimple: React.FC<SimpleProps> = ({ log, className }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logEl = logRef.current;
    if (!logEl) {
      return;
    }

    logEl.scrollTo({ top: logEl.scrollHeight, behavior: 'smooth' });
  }, [log]);

  return (
    <div className={clsx(styles.logWrapper, className)}>
      <IconButton
        className={styles.copy}
        onClick={() => {
          copy(log);
        }}
      >
        <BsClipboard />
      </IconButton>
      <div className={styles.log} ref={logRef}>
        {log}
      </div>
    </div>
  );
};
