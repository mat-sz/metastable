import clsx from 'clsx';
import React from 'react';
import { BsStarFill } from 'react-icons/bs';

import styles from './index.module.scss';

interface RatingProps {
  value: number;
  small?: boolean;
}

export const Rating: React.FC<RatingProps> = ({ value, small }) => {
  return (
    <div className={clsx(styles.rating, { [styles.small]: small })}>
      <div className={styles.background}>
        <BsStarFill />
        <BsStarFill />
        <BsStarFill />
        <BsStarFill />
        <BsStarFill />
      </div>
      <div className={styles.value} style={{ width: `${(value / 5) * 100}%` }}>
        <BsStarFill />
        <BsStarFill />
        <BsStarFill />
        <BsStarFill />
        <BsStarFill />
      </div>
    </div>
  );
};
