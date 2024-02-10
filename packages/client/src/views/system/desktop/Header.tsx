import React from 'react';
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeClose,
  VscChromeRestore,
} from 'react-icons/vsc';
import { observer } from 'mobx-react-lite';

import { ElectronWindow } from '@api/electron';
import { mainStore } from '@stores/MainStore';
import { IS_ELECTRON, IS_MAC } from '@utils/config';
import styles from './Header.module.scss';
import { Menu } from '../common/Menu';

interface Props {
  showMenu?: boolean;
}

export const Header: React.FC<Props> = observer(({ showMenu = !IS_MAC }) => {
  return (
    <div className={styles.header}>
      {showMenu && <Menu className={styles.menu} />}
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
