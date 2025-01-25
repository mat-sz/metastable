import React from 'react';
import { BsCheck } from 'react-icons/bs';

import styles from './index.module.scss';

interface ToggleProps {
  label?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  value,
  onChange,
  disabled,
}) => {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        className={styles.input}
        disabled={disabled}
        checked={value}
        onChange={e => onChange?.(e.target.checked)}
      />
      <span className={styles.track}>
        <span className={styles.indicator}>
          <span className={styles.checkmark}>
            <BsCheck />
          </span>
        </span>
      </span>
      {!!label && <span className={styles.label}>{label}</span>}
    </label>
  );
};
