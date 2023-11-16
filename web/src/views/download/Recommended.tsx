import React from 'react';

import styles from './Recommended.module.scss';
import { downloadable } from '../../data/models';
import { DownloadButton } from './DownloadButton';

export const Recommended: React.FC = () => {
  return (
    <div>
      {downloadable.map((group, i) => (
        <div key={i} className={styles.group}>
          <div className={styles.title}>{group.name}</div>
          <div className={styles.models}>
            {group.models.map((model, i) => {
              return (
                <div key={i} className={styles.model}>
                  <span>{model.name}</span>
                  <DownloadButton
                    filename={model.downloads[0].filename}
                    type={model.downloads[0].type}
                    url={model.downloads[0].url}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
