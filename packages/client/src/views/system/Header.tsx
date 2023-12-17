import React from 'react';
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeClose,
} from 'react-icons/vsc';

import styles from './Header.module.scss';
import { mainStore } from '../../stores/MainStore';
import { useUI } from '../../contexts/ui';
import { NewProject } from '../../modals/newProject';
import { OpenProject } from '../../modals/openProject';
import { ModelManager } from '../../modals/models';
import { IS_ELECTRON, IS_MAC } from '../../config';

export const Header: React.FC = () => {
  const { showModal } = useUI();

  return (
    <div className={styles.header}>
      {!IS_MAC && (
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
      )}
      <div className={styles.title}>
        <h1>Metastable</h1>
      </div>
      {!IS_MAC && IS_ELECTRON && (
        <div className={styles.controls}>
          <button>
            <VscChromeMinimize />
          </button>
          <button>
            <VscChromeMaximize />
          </button>
          <button>
            <VscChromeClose />
          </button>
        </div>
      )}
    </div>
  );
};
