import { observer } from 'mobx-react-lite';
import React from 'react';
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from 'react-icons/vsc';

import { mainStore } from '$stores/MainStore';
import { IS_ELECTRON, IS_MAC } from '$utils/config';
import styles from './Controls.module.scss';

import { API } from '$api';

export const Controls: React.FC = observer(() => {
  if (!IS_ELECTRON || IS_MAC) {
    return null;
  }

  return (
    <div className={styles.controls}>
      <button onClick={() => API.electron.window.minimize.mutate()}>
        <VscChromeMinimize />
      </button>
      {mainStore.isMaximized ? (
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
