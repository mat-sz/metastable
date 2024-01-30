import React from 'react';
import { BsDownload, BsHeartFill } from 'react-icons/bs';
import { MdNoPhotography } from 'react-icons/md';

import styles from './Card.module.scss';
import { Rating } from '../rating';

interface CardProps {
  name?: string;
  imageUrl?: string;
  onClick?: () => void;
}

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  children,
  imageUrl,
  name,
  onClick,
}) => {
  return (
    <div className={styles.card} onClick={onClick}>
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
          <div>{children}</div>
          <div className={styles.name}>{name}</div>
        </div>
      </div>
    </div>
  );
};

interface CardStatsProps {
  rating?: number;
  ratingCount?: number;
  downloadCount?: number;
  favoriteCount?: number;
}

export const CardStats: React.FC<CardStatsProps> = ({
  rating,
  ratingCount,
  downloadCount,
  favoriteCount,
}) => {
  return (
    <>
      {!!rating && (
        <div className={styles.stats}>
          <div>
            <Rating value={rating} small />
            {!!ratingCount && <span>({ratingCount})</span>}
          </div>
        </div>
      )}
      {!!downloadCount && !!favoriteCount && (
        <div className={styles.stats}>
          {!!downloadCount && (
            <div>
              <BsDownload />
              <span>{downloadCount}</span>
            </div>
          )}
          {!!favoriteCount && (
            <div>
              <BsHeartFill />
              <span>{favoriteCount}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
