import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsCheck, BsChevronRight, BsExclamation, BsX } from 'react-icons/bs';

import styles from './Item.module.scss';
import { useListItem } from './ListContext';

interface Props {
  id: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  status: 'incomplete' | 'ok' | 'warning' | 'error';
  progress?: number;
}

export const Item: React.FC<React.PropsWithChildren<Props>> = observer(
  ({ id, icon, title, description, status, children, progress }) => {
    const { toggle, isOpen, shouldDarken } = useListItem(id);

    if (status !== 'incomplete') {
      progress = undefined;
    }

    return (
      <div
        className={clsx(styles.item, {
          [styles.open]: isOpen,
          [styles.darken]: shouldDarken,
        })}
        onClick={toggle}
      >
        <div className={styles.header}>
          <div className={styles.icon}>{icon}</div>
          <div className={styles.info}>
            <div className={styles.title}>{title}</div>
            {!!description && (
              <div className={styles.description}>{description}</div>
            )}
          </div>
          <div
            className={clsx(styles.status, {
              [styles[status]]: typeof progress === 'undefined',
            })}
            style={
              typeof progress === 'undefined'
                ? undefined
                : {
                    background: `conic-gradient(var(--progress-fg) ${
                      progress * 3.6
                    }deg, var(--progress-bg) 0deg)`,
                  }
            }
          >
            {typeof progress === 'undefined' ? (
              <>
                {status === 'incomplete' && <BsChevronRight />}
                {status === 'ok' && <BsCheck />}
                {status === 'warning' && <BsExclamation />}
                {status === 'error' && <BsX />}
              </>
            ) : (
              <div className={styles.progress}>{Math.floor(progress)}%</div>
            )}
          </div>
        </div>
        <div className={styles.body} onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  },
);
