import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { filesize } from '../../../helpers';

export const Queue: React.FC = observer(() => {
  const downloads = mainStore.downloads;
  return (
    <div>
      {downloads.queue.map(download => {
        const percent = (download.progress / download.size) * 100;
        const speed =
          download.startedAt && download.state === 'in_progress'
            ? download.progress /
              ((new Date().getTime() - download.startedAt) / 1000)
            : undefined;

        return (
          <div key={download.id} className={styles.item}>
            <div>
              <div>{download.name}</div>
            </div>
            <div>
              <div className={styles.progress}>
                <div className={styles.progressInfo}>
                  <span>{Math.round(percent)}%</span>
                  {speed && <span>[{filesize(speed)}/s]</span>}
                  <span>
                    [{filesize(download.progress)} / {filesize(download.size)}]
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
              {download.state === 'in_progress' ||
              download.state === 'queued' ? (
                <button onClick={() => downloads.cancel(download.id)}>
                  Cancel
                </button>
              ) : (
                <button onClick={() => downloads.dismiss(download.id)}>
                  Dismiss
                </button>
              )}
            </div>
          </div>
        );
      })}
      {downloads.queue.length === 0 && <div>No active downloads.</div>}
    </div>
  );
});
