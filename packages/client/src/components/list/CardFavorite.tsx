import React from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';

import styles from './index.module.scss';

interface CardFavoriteProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export const CardFavorite: React.FC<CardFavoriteProps> = ({
  value,
  onChange,
}) => {
  return (
    <button
      className={styles.favorite}
      onClick={e => {
        e.stopPropagation();
        onChange?.(!value);
      }}
    >
      {value ? <BsStarFill /> : <BsStar />}
    </button>
  );
};
