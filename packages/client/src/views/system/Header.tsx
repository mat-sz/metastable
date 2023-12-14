import React from 'react';

import styles from './Header.module.scss';
import { mainStore } from '../../stores/MainStore';
import { useUI } from '../../contexts/ui';
import { NewProject } from '../../modals/newProject';
import { OpenProject } from '../../modals/openProject';
import { ModelManager } from '../../modals/models';

export const Header: React.FC = () => {
  const { showModal } = useUI();

  return (
    <div className={styles.header}>
      <div className={styles.menu}>
        <button
          onClick={() => showModal(<NewProject />)}
          disabled={!mainStore.info.models.checkpoints?.[0]}
        >
          New
        </button>
        <button onClick={() => showModal(<OpenProject />)}>Open</button>
        {!!mainStore.project && (
          <>
            <button onClick={() => mainStore.project?.save()}>Save</button>
          </>
        )}
        <button onClick={() => showModal(<ModelManager />)}>
          Model manager
        </button>
      </div>
      <div className={styles.title}>
        <h1>Metastable</h1>
      </div>
    </div>
  );
};
