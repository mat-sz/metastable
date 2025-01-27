import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsCheck, BsHourglass, BsXCircleFill, BsXLg } from 'react-icons/bs';

import { Button } from '$components/button';
import { UploadQueueStore } from '$stores/project/UploadQueueStore';
import styles from './index.module.scss';

interface Props {
  queue: UploadQueueStore;
}

export const UploadQueue: React.FC<Props> = observer(({ queue }) => {
  if (!queue.items.length) {
    return undefined;
  }

  return (
    <div>
      <div className={styles.actions}>
        <span>Upload files ({queue.items.length}):</span>
        <Button onClick={() => queue.run()} disabled={queue.isRunning}>
          Upload
        </Button>
        <Button onClick={() => queue.reset()} disabled={queue.isRunning}>
          Reset
        </Button>
      </div>
      <div className={styles.queue}>
        {queue.items.map(item => (
          <div className={styles.file} key={item.id}>
            {item.state ? (
              <div className={styles.state}>
                {item.state === 'uploading' && <BsHourglass />}
                {item.state === 'done' && <BsCheck />}
                {item.state === 'error' && <BsXCircleFill />}
              </div>
            ) : (
              <>
                <button onClick={() => queue.remove(item.id)}>
                  <BsXLg />
                </button>
              </>
            )}
            <img src={item.url} />
          </div>
        ))}
      </div>
    </div>
  );
});
