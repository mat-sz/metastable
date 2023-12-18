import React from 'react';
import { observer } from 'mobx-react-lite';
import { BsX } from 'react-icons/bs';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { IconButton } from '../../../components';
import { filesize } from '../../../helpers';

export const Queue: React.FC = observer(() => {
  const downloads = mainStore.downloads;
  return (
    <div>
      {downloads.queue.map(download => (
        <div key={download.id} className={styles.item}>
          <div>
            <div>{download.filename}</div>
            <div>
              <progress value={download.progress} max={download.size} />
            </div>
          </div>
          <div>
            <div>
              {filesize(download.progress)} / {filesize(download.size)}
            </div>
            {download.startedAt && download.state === 'in_progress' && (
              <div>
                {filesize(
                  download.progress /
                    ((new Date().getTime() - download.startedAt) / 1000),
                )}
                /s
              </div>
            )}
          </div>
          <div>{download.state}</div>
          <div>
            <IconButton
              onClick={() => downloads.cancel(download.id)}
              title="Cancel"
            >
              <BsX />
            </IconButton>
          </div>
        </div>
      ))}
      {downloads.queue.length === 0 && <div>No active downloads.</div>}
    </div>
  );
});
