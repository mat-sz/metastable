import React, { useState } from 'react';

import { TRPC } from '$api';
import { Tag } from '$components/tag';
import { ThumbnailDisplay } from '$components/thumbnailDisplay';
import { modelStore } from '$stores/ModelStore';
import { basename, filesize } from '$utils/file';
import { stringToColor } from '$utils/string';
import { resolveImage } from '$utils/url';
import styles from './LoadedModelsList.module.scss';

interface LoadedModel {
  path: string;
  size?: number;
}

export const LoadedModelsList: React.FC = () => {
  const [models, setModels] = useState<LoadedModel[]>([]);
  TRPC.instance.onModelCacheChange.useSubscription(undefined, {
    onData: setModels,
  });
  return (
    <div>
      {models.length === 0 && (
        <div className={styles.empty}>
          No models are currently loaded into memory.
        </div>
      )}
      <ul className={styles.list}>
        {models.map(item => {
          const model = modelStore.findByPath(item.path);

          if (!model) {
            return (
              <li key={basename(item.path)}>
                <span>{basename(item.path)}</span>
                {!!item.size && <Tag>{filesize(item.size)}</Tag>}
              </li>
            );
          }

          return (
            <li key={item.path}>
              <ThumbnailDisplay
                className={styles.icon}
                color={stringToColor(model.mrn)}
                imageUrl={resolveImage(model.coverMrn, 'thumbnail')}
              />
              <span>{model.name}</span>
              <Tag>{filesize(item.size || model.file.size)}</Tag>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
