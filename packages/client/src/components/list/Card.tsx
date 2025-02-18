import React from 'react';
import { BsThreeDots } from 'react-icons/bs';
import { useContextMenu } from 'use-context-menu';

import { ThumbnailDisplay } from '$components/thumbnailDisplay';
import styles from './index.module.scss';

export interface CardProps {
  name?: string;
  imageUrl?: string;
  isVideo?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  onMiddleClick?: () => void;
  color?: string;
  menu?: React.ReactNode;
}

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  children,
  imageUrl,
  isVideo,
  name,
  icon,
  onClick,
  color,
  menu,
  onMiddleClick,
}) => {
  const { contextMenu, onContextMenu } = useContextMenu(menu);

  return (
    <div
      role="button"
      className={styles.card}
      onClick={onClick}
      onContextMenu={menu ? onContextMenu : undefined}
      onPointerUp={e => {
        if (e.pointerType === 'mouse' && e.button === 1) {
          e.stopPropagation();
          onMiddleClick?.();
        }
      }}
    >
      <ThumbnailDisplay
        className={styles.thumbnail}
        imageClassName={styles.image}
        noImageClassName={styles.noImage}
        color={color}
        icon={icon}
        imageUrl={imageUrl}
        isVideo={isVideo}
      />
      <div className={styles.details}>
        <div className={styles.info}>{children}</div>
        <div className={styles.name}>{name}</div>
      </div>
      {!!menu && (
        <>
          <button
            onClick={e => {
              e.stopPropagation();
              onContextMenu(e);
            }}
            className={styles.menuToggle}
          >
            <BsThreeDots />
          </button>
          {contextMenu}
        </>
      )}
    </div>
  );
};
