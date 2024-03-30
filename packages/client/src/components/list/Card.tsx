import React, { useEffect, useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';

import styles from './index.module.scss';

interface CardProps {
  name?: string;
  imageUrl?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  color?: string;
}

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  children,
  imageUrl,
  name,
  icon,
  onClick,
  color,
}) => {
  return (
    <div className={styles.card} onClick={onClick}>
      {imageUrl ? (
        <div className={styles.image} style={{ backgroundColor: color }}>
          <img
            crossOrigin="anonymous"
            className={styles.background}
            src={imageUrl}
          />
        </div>
      ) : (
        <div className={styles.icon} style={{ backgroundColor: color }}>
          {!imageUrl && icon}
        </div>
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
}

export const CardTag: React.FC<React.PropsWithChildren<CardTagProps>> = ({
  icon,
  children,
}) => {
  return (
    <div className={styles.tag}>
      {icon}
      {!!children && <span>{children}</span>}
    </div>
  );
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
