import { LogItem } from '@metastable/types';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { BsClipboard } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { copy } from '$utils/clipboard';
import styles from './index.module.scss';

interface Props {
  items: LogItem[];
}

export const Log: React.FC<Props> = ({ items }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logEl = logRef.current;
    if (!logEl) {
      return;
    }

    logEl.scroll({ top: logEl.scrollHeight, left: 0, behavior: 'smooth' });
  }, [items]);

  return (
    <div className={styles.logWrapper}>
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
      <div className={styles.log} ref={logRef}>
        {items.map((item, i) => (
          <div
            key={i}
            className={clsx({ [styles.error]: item.type === 'stderr' })}
          >
            <span className={styles.timestamp}>
              [{new Date(item.timestamp).toLocaleTimeString()}]
            </span>
            <span className={styles.text}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SimpleProps {
  log: string;
}

export const LogSimple: React.FC<SimpleProps> = ({ log }) => {
  return (
    <div className={styles.logWrapper}>
      <IconButton
        className={styles.copy}
        onClick={() => {
          copy(log);
        }}
      >
        <BsClipboard />
      </IconButton>
      <div className={styles.log}>{log}</div>
    </div>
  );
};
