import React, { useState } from 'react';
import { BsArrowUpRightSquare, BsStarFill } from 'react-icons/bs';

import styles from './index.module.scss';
import { TYPE_NAMES, downloadable } from '../../data/models';
import { IconButton } from '../iconButton';
import { DownloadableModel } from '../../types/model';

interface Props {
  beforeModel?: (model: DownloadableModel) => React.ReactNode;
  afterModel?: (model: DownloadableModel) => React.ReactNode;
}

export const ModelList: React.FC<Props> = ({ beforeModel, afterModel }) => {
  const [openGroup, setOpenGroup] = useState(0);

  return (
    <div className={styles.list}>
      {downloadable.map((group, i) => (
        <div key={i} className={styles.group}>
          <div className={styles.header} onClick={() => setOpenGroup(i)}>
            <div className={styles.info}>
              {group.recommended && <BsStarFill />}
              <div className={styles.title}>{group.name}</div>
              <div className={styles.type}>{TYPE_NAMES[group.type]}</div>
            </div>
            {group.description && (
              <div className={styles.description}>{group.description}</div>
            )}
          </div>
          {openGroup === i && (
            <div className={styles.models}>
              {group.models.map((model, i) => (
                <div key={i} className={styles.model}>
                  {beforeModel?.(model)}
                  <div className={styles.modelInfo}>
                    <div className={styles.modelName}>
                      {model.recommended && <BsStarFill />}
                      <span>{model.name}</span>
                      <div className={styles.type}>
                        {TYPE_NAMES[model.type]}
                      </div>
                      {!!model.homepage && (
                        <IconButton
                          onClick={() =>
                            window.open(
                              model.homepage,
                              '_blank',
                              'noopener noreferrer',
                            )
                          }
                        >
                          <BsArrowUpRightSquare />
                        </IconButton>
                      )}
                    </div>
                    {model.description && (
                      <div className={styles.description}>
                        {model.description}
                      </div>
                    )}
                  </div>
                  {afterModel?.(model)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
