import clsx from 'clsx';
import React from 'react';
import { BsCheck } from 'react-icons/bs';

import styles from './index.module.scss';

interface CheckboxProps {
  className?: string;
  label?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  className,
  label,
  value,
  onChange,
}) => {
  return (
    <label className={clsx(styles.checkbox, className)}>
      <input
        type="checkbox"
        className={styles.input}
        checked={value}
        onChange={e => onChange?.(e.target.checked)}
      />
      <div className={styles.indicator}>
        <BsCheck />
      </div>
      {!!label && <span className={styles.label}>{label}</span>}
    </label>
  );
};
