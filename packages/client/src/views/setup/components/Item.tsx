import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { BsCheck, BsChevronRight, BsExclamation, BsX } from 'react-icons/bs';

import styles from './Item.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { runInAction } from 'mobx';

interface Props {
  id: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  status: 'incomplete' | 'ok' | 'warning' | 'error';
}

export const Item: React.FC<React.PropsWithChildren<Props>> = observer(
  ({ id, icon, title, description, status, children }) => {
    const selected = id === mainStore.setup.selected;
    const otherSelected = !!mainStore.setup.selected && !selected;

    return (
      <div
        className={clsx(styles.item, {
          [styles.open]: selected,
          [styles.darken]: otherSelected,
        })}
        onClick={() => {
          runInAction(() => {
            mainStore.setup.selected = selected ? undefined : id;
          });
        }}
      >
        <div className={styles.header}>
          <div className={styles.icon}>{icon}</div>
          <div className={styles.info}>
            <div className={styles.title}>{title}</div>
            <div className={styles.description}>{description}</div>
          </div>
          <div className={clsx(styles.status, styles[status])}>
            {status === 'incomplete' && <BsChevronRight />}
            {status === 'ok' && <BsCheck />}
            {status === 'warning' && <BsExclamation />}
            {status === 'error' && <BsX />}
          </div>
        </div>
        <div className={styles.body} onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  },
);
