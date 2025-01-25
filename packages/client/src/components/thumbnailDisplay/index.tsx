import clsx from 'clsx';
import React from 'react';

import styles from './index.module.scss';

interface ThumbnailDisplayProps {
  className?: string;
  imageClassName?: string;
  noImageClassName?: string;
  imageUrl?: string;
  isVideo?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

export const ThumbnailDisplay: React.FC<
  React.PropsWithChildren<ThumbnailDisplayProps>
> = ({
  className,
  imageClassName,
  noImageClassName,
  imageUrl,
  isVideo,
  icon,
  color,
}) => {
  return imageUrl ? (
    <div className={clsx(styles.image, imageClassName, className)}>
      {isVideo ? (
        <video
          crossOrigin="anonymous"
          src={imageUrl}
          autoPlay
          muted
          playsInline
          loop
        />
      ) : (
        <img crossOrigin="anonymous" src={imageUrl} />
      )}
    </div>
  ) : (
    <div className={clsx(styles.noImage, noImageClassName, className)}>
      <div
        style={{ backgroundColor: color }}
        className={styles.colorBackground}
      ></div>
      <div className={styles.icon}>{icon}</div>
    </div>
  );
};
