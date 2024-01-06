import React from 'react';
import { MdNoPhotography } from 'react-icons/md';
import { Model } from '@metastable/types';

import styles from './List.module.scss';
import { getStaticUrl } from '../../config';

interface ItemProps {
  type: string;
  model: Model;
  onSelect: (model: Model) => void;
}

export const Item: React.FC<ItemProps> = ({ type, model, onSelect }) => {
  const imageUrl = model.image
    ? getStaticUrl(`/models/${type}/${model.image}`)
    : undefined;

  return (
    <div className={styles.model} onClick={() => onSelect(model)}>
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
          <div className={styles.name}>{model.name || model.file.name}</div>
        </div>
      </div>
    </div>
  );
};

interface ListProps {
  type: string;
  data: Model[];
  onSelect: (model: Model) => void;
}

export const List: React.FC<ListProps> = ({ type, data, onSelect }) => {
  return (
    <div className={styles.list}>
      {data.map(model => (
        <Item
          type={type}
          key={model.file.name}
          onSelect={onSelect}
          model={model}
        />
      ))}
    </div>
  );
};
