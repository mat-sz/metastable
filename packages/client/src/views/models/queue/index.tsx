import { TaskState } from '@metastable/types';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { ProgressBar } from '$components/progressBar';
import { mainStore } from '$stores/MainStore';
import { filesize } from '$utils/file';
import { timestr } from '$utils/string';
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
          <div
            key={download.id}
            className={clsx(styles.item, {
              [styles.error]: download.state === TaskState.FAILED,
              [styles.success]: download.state === TaskState.SUCCESS,
            })}
          >
            <div>
              <div>{download.data.name}</div>
            </div>
            <div>
              <ProgressBar
                className={styles.progress}
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
                <span>
                  ETA:{' '}
                  {timestr(
                    (download.data.size - download.data.offset) /
                      download.data.speed,
                  )}
                </span>
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
