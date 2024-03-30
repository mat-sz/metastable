import { TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { ProgressBar } from '$components/progressBar';
import { mainStore } from '$stores/MainStore';
import { filesize } from '$utils/file';
import styles from './index.module.scss';

export const Queue: React.FC = observer(() => {
  const downloads = mainStore.tasks.downloads;
  return (
    <div>
      {downloads.map(download => {
        const percent = (download.progress || 0) * 100;
        const speed =
          download.startedAt && download.state === TaskState.RUNNING
            ? download.data.speed
            : undefined;

        return (
          <div key={download.id} className={styles.item}>
            <div>
              <div>{download.data.name}</div>
            </div>
            <div>
              <ProgressBar
                value={download.data.offset}
                max={download.data.size}
              >
                <span>{Math.round(percent)}%</span>
                {!!speed && <span>[{filesize(speed)}/s]</span>}
                <span>
                  [{filesize(download.data.offset)} /{' '}
                  {filesize(download.data.size)}]
                </span>
                <span>[{download.state}]</span>
              </ProgressBar>
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
