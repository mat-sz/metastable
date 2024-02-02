import React from 'react';
import { MdNoPhotography } from 'react-icons/md';

import styles from './index.module.scss';

interface CardProps {
  name?: string;
  imageUrl?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  children,
  imageUrl,
  name,
  icon,
  onClick,
}) => {
  return (
    <div className={styles.card} onClick={onClick}>
      {imageUrl ? (
        <img
          crossOrigin="anonymous"
          className={styles.background}
          src={imageUrl}
        />
      ) : (
        <div className={styles.noPhotos}>{icon || <MdNoPhotography />}</div>
      )}
      <div className={styles.details}>
        <div className={styles.info}>{children}</div>
        <div className={styles.name}>{name}</div>
      </div>
    </div>
  );
};

export const CardTags: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className={styles.tags}>{children}</div>;
};

interface CardTagProps {
  icon?: React.ReactNode;
  text?: React.ReactNode;
}

export const CardTag: React.FC<CardTagProps> = ({ icon, text }) => {
  return (
    <div className={styles.tag}>
      {icon}
      {!!text && <span>{text}</span>}
    </div>
  );
};
