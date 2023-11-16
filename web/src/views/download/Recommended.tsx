import React from 'react';
import { observer } from 'mobx-react-lite';
import { BsDownload } from 'react-icons/bs';

import styles from './Recommended.module.scss';
import { mainStore } from '../../stores/MainStore';
import { downloadable } from '../../data/models';
import { IconButton } from '../../components/IconButton';

export const Recommended: React.FC = observer(() => {
  const downloads = mainStore.downloads;

  return (
    <div>
      {downloadable.map((group, i) => (
        <div key={i} className={styles.group}>
          <div className={styles.title}>{group.name}</div>
          <div className={styles.models}>
            {group.models.map((model, i) => {
              const isQueued = downloads.queue.find(
                download => download.filename === model.downloads[0].filename,
              );

              return (
                <div key={i} className={styles.model}>
                  <span>{model.name}</span>
                  {!isQueued && (
                    <IconButton
                      onClick={() =>
                        downloads.download(
                          model.type,
                          model.downloads[0].url,
                          model.downloads[0].filename,
                        )
                      }
                      title="Download"
                    >
                      <BsDownload />
                    </IconButton>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});
