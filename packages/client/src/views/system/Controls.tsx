import { observer } from 'mobx-react-lite';
import React from 'react';
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from 'react-icons/vsc';

import { API } from '$api';
import { useUIStore } from '$store/ui';
import { IS_ELECTRON, IS_MAC } from '$utils/config';
import styles from './Controls.module.scss';

export const Controls: React.FC = observer(() => {
  const isMaximized = useUIStore(state => state.isMaximized);

  if (!IS_ELECTRON || IS_MAC) {
    return null;
  }

  return (
    <div className={styles.controls}>
      <button onClick={() => API.electron.window.minimize.mutate()}>
        <VscChromeMinimize />
      </button>
      {isMaximized ? (
        <button onClick={() => API.electron.window.restore.mutate()}>
          <VscChromeRestore />
        </button>
      ) : (
        <button onClick={() => API.electron.window.maximize.mutate()}>
          <VscChromeMaximize />
        </button>
      )}
      <button onClick={() => API.electron.window.close.mutate()}>
        <VscChromeClose />
      </button>
    </div>
  );
});
