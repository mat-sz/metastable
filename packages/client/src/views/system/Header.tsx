import React from 'react';
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeClose,
  VscChromeRestore,
} from 'react-icons/vsc';
import { observer } from 'mobx-react-lite';

import styles from './Header.module.scss';
import { mainStore } from '../../stores/MainStore';
import { useUI } from '../../contexts/ui';
import { NewProject } from '../../modals/newProject';
import { OpenProject } from '../../modals/openProject';
import { ModelManager } from '../../modals/models';
import { IS_ELECTRON, IS_MAC } from '../../config';
import { ElectronWindow } from '../../api/electron';

interface Props {
  showMenu?: boolean;
}

export const Header: React.FC<Props> = observer(({ showMenu = !IS_MAC }) => {
  const { showModal } = useUI();

  return (
    <div className={styles.header}>
      {showMenu && (
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
          <button onClick={() => ElectronWindow.minimize()}>
            <VscChromeMinimize />
          </button>
          {mainStore.isMaximized ? (
            <button onClick={() => ElectronWindow.restore()}>
              <VscChromeRestore />
            </button>
          ) : (
            <button onClick={() => ElectronWindow.maximize()}>
              <VscChromeMaximize />
            </button>
          )}
          <button onClick={() => ElectronWindow.close()}>
            <VscChromeClose />
          </button>
        </div>
      )}
    </div>
  );
});
