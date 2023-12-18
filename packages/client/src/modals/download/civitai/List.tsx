import React from 'react';
import { BsDownload, BsHeartFill } from 'react-icons/bs';
import { MdNoPhotography } from 'react-icons/md';

import styles from './List.module.scss';
import { CivitAIModel, CivitAIResponse } from '../../../types/civitai';
import { Rating } from '../../../components';

interface ItemProps {
  model: CivitAIModel;
  onSelect: (model: CivitAIModel) => void;
}

export const Item: React.FC<ItemProps> = ({ model, onSelect }) => {
  const imageUrl = model.modelVersions?.[0]?.images[0]?.url;

  return (
    <div
      key={model.id}
      className={styles.model}
      onClick={() => onSelect(model)}
    >
      <div className={styles.preview}>
        {imageUrl ? (
          <img
            crossOrigin="anonymous"
            className={styles.background}
            src={imageUrl}
          />
        ) : (
          <div className={styles.noPhotos}>
            <MdNoPhotography />
          </div>
        )}
        <div className={styles.details}>
          <div>
            <div className={styles.stats}>
              <div>
                <Rating value={model.stats.rating} small />
                <span>({model.stats.ratingCount})</span>
              </div>
            </div>
            <div className={styles.stats}>
              <div>
                <BsDownload />
                <span>{model.stats.downloadCount}</span>
              </div>
              <div>
                <BsHeartFill />
                <span>{model.stats.favoriteCount}</span>
              </div>
            </div>
          </div>
          <div className={styles.name}>{model.name}</div>
        </div>
      </div>
    </div>
  );
};

interface ListProps {
  data: CivitAIResponse;
  onSelect: (model: CivitAIModel) => void;
}

export const List: React.FC<ListProps> = ({ data, onSelect }) => {
  return (
    <div className={styles.list}>
      {data.items.map(model => (
        <Item key={model.id} onSelect={() => onSelect(model)} model={model} />
      ))}
    </div>
  );
};
