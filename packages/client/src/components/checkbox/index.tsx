import React from 'react';
import { BsCheck } from 'react-icons/bs';

import styles from './index.module.scss';

interface CheckboxProps {
  label?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <label className={styles.checkbox}>
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
