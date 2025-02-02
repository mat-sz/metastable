import React, { useEffect, useState } from 'react';
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

export const CardTags: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className={styles.tags}>{children}</div>;
};

export const CardMenu: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const close = () => setOpen(false);
    document.addEventListener('pointerdown', close);

    return () => {
      document.removeEventListener('pointerdown', close);
    };
  }, [open]);

  return (
    <div
      className={styles.menu}
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <button
        onClick={() => setOpen(current => !current)}
        onPointerDown={e => e.stopPropagation()}
        className={styles.menuToggle}
      >
        <BsThreeDots />
      </button>
      {open && <div className={styles.menuItems}>{children}</div>}
    </div>
  );
};

interface CardMenuItemProps {
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const CardMenuItem: React.FC<
  React.PropsWithChildren<CardMenuItemProps>
> = ({ icon, children, onClick }) => {
  return (
    <button
      className={styles.menuItem}
      onPointerDown={() => {
        onClick?.();
      }}
    >
      {icon}
      {icon ? <span>{children}</span> : children}
    </button>
  );
};
