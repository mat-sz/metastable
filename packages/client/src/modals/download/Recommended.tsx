import React, { useState } from 'react';
import { BsStarFill } from 'react-icons/bs';
import { ModelType } from '@metastable/types';

import styles from './Recommended.module.scss';
import { downloadable } from '../../data/models';
import { DownloadButton } from './DownloadButton';

const TYPE_NAMES: Record<ModelType, string> = {
  [ModelType.CHECKPOINT]: 'Checkpoint',
  [ModelType.CLIP]: 'CLIP',
  [ModelType.CLIP_VISION]: 'CLIP Vision',
  [ModelType.CONTROLNET]: 'ControlNet',
  [ModelType.DIFFUSER]: 'Diffuser',
  [ModelType.EMBEDDING]: 'Embedding',
  [ModelType.GLIGEN]: 'GLIGEN',
  [ModelType.HYPERNETWORK]: 'HyperNetwork',
  [ModelType.LORA]: 'LoRA',
  [ModelType.STYLE_MODEL]: 'Style model',
  [ModelType.UPSCALE_MODEL]: 'Upscale model',
  [ModelType.VAE]: 'VAE',
  [ModelType.VAE_APPROX]: 'VAE Approximation',
};

export const Recommended: React.FC = () => {
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
                  <div>
                    <div className={styles.modelName}>
                      {model.recommended && <BsStarFill />}
                      <span>{model.name}</span>
                      <div className={styles.type}>
                        {TYPE_NAMES[model.type]}
                      </div>
                    </div>
                    {model.description && (
                      <div className={styles.description}>
                        {model.description}
                      </div>
                    )}
                  </div>
                  <DownloadButton files={model.downloads} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
