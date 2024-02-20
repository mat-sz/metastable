import React from 'react';
import { BsCheck, BsHourglass, BsX } from 'react-icons/bs';

import styles from './UploadQueue.module.scss';

export interface UploadQueueItem {
  id: string;
  file: File;
  url: string;
  state?: 'uploading' | 'done';
}

interface Props {
  items: UploadQueueItem[];
  onStart?: () => void;
  onReset?: () => void;
  onRemove?: (id: string) => void;
}

export const UploadQueue: React.FC<Props> = ({
  items,
  onRemove,
  onStart,
  onReset,
}) => {
  return (
    <div>
      <div>
        <span>Upload files ({items.length}):</span>
        <button onClick={onStart}>Upload</button>
        <button onClick={onReset}>Reset</button>
      </div>
      <div className={styles.queue}>
        {items.map(item => (
          <div className={styles.file} key={item.id}>
            {item.state ? (
              <div className={styles.state}>
                {item.state === 'uploading' && <BsHourglass />}
                {item.state === 'done' && <BsCheck />}
              </div>
            ) : (
              <>
                {onRemove && (
                  <button onClick={() => onRemove(item.id)}>
                    <BsX />
                  </button>
                )}
              </>
            )}
            <img src={item.url} />
          </div>
        ))}
      </div>
    </div>
  );
};
