import { observer } from 'mobx-react-lite';
import React from 'react';

import { Tag } from '$components/tag';
import { ThumbnailDisplay } from '$components/thumbnailDisplay';
import { mainStore } from '$stores/MainStore';
import { modelStore } from '$stores/ModelStore';
import { basename, filesize } from '$utils/file';
import { stringToColor } from '$utils/string';
import { resolveImage } from '$utils/url';
import styles from './LoadedModelsList.module.scss';

export const LoadedModelsList: React.FC = observer(() => {
  return (
    <div>
      {mainStore.modelCache.length === 0 && (
        <div>No models are currently loaded.</div>
      )}
      <ul className={styles.list}>
        {mainStore.modelCache.map(path => {
          const model = modelStore.findByPath(path);

          if (!model) {
            return (
              <li key={basename(path)}>
                <span>{basename(path)}</span>
              </li>
            );
          }

          return (
            <li key={path}>
              <ThumbnailDisplay
                className={styles.icon}
                color={stringToColor(model.mrn)}
                imageUrl={resolveImage(model.coverMrn, 'thumbnail')}
              />
              <span>{model.name}</span>
              <Tag>{filesize(model.file.size)}</Tag>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
