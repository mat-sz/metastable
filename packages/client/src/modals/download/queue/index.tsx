import React from 'react';
import { observer } from 'mobx-react-lite';
import { TaskState } from '@metastable/types';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { filesize } from '../../../helpers';

export const Queue: React.FC = observer(() => {
  const downloads = mainStore.tasks.downloads;
  return (
    <div>
      {downloads.map(download => {
        const percent = (download.progress || 0) * 100;
        const speed =
          download.startedAt && download.state === TaskState.RUNNING
            ? (download.data.offset || 0) /
              ((new Date().getTime() - download.startedAt) / 1000)
            : undefined;

        return (
          <div key={download.id} className={styles.item}>
            <div>
              <div>{download.data.name}</div>
            </div>
            <div>
              <div className={styles.progress}>
                <div className={styles.progressInfo}>
                  <span>{Math.round(percent)}%</span>
                  {speed && <span>[{filesize(speed)}/s]</span>}
                  <span>
                    [{filesize(download.data.offset)} /{' '}
                    {filesize(download.data.size)}]
                  </span>
                  <span>[{download.state}]</span>
                </div>
                <div
                  className={styles.progressBar}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
            <div>
              {download.state === TaskState.RUNNING ||
              download.state === TaskState.QUEUED ? (
                <button
                  onClick={() =>
                    mainStore.tasks.cancel('downloads', download.id)
                  }
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() =>
                    mainStore.tasks.dismiss('downloads', download.id)
                  }
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        );
      })}
      {downloads.length === 0 && <div>No active downloads.</div>}
    </div>
  );
});
