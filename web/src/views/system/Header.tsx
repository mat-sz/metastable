import React from 'react';

import styles from './Header.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Header: React.FC = () => {
  return (
    <div className={styles.header}>
      <div className={styles.menu}>
        <button onClick={() => (mainStore.modal = 'new_project')}>New</button>
        <button onClick={() => (mainStore.modal = 'open_project')}>Open</button>
        {!!mainStore.project && (
          <>
            <button onClick={() => mainStore.project?.save()}>Save</button>
          </>
        )}
        <button onClick={() => (mainStore.modal = 'models')}>
          Model manager
        </button>
      </div>
      <div className={styles.title}>
        <h1>Metastable</h1>
      </div>
    </div>
  );
};
