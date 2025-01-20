import clsx from 'clsx';
import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { IS_ELECTRON } from '$utils/config';
import styles from './index.module.scss';

export interface PathInputProps {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const PathInput: React.FC<PathInputProps> = ({
  className,
  value,
  onChange,
}) => {
  if (!IS_ELECTRON) {
    return;
  }

  return (
    <div className={clsx(styles.wrapper, className)}>
      <input type="text" readOnly value={value} />
      <Button
        onClick={() => {
          API.electron.shell.selectDirectory
            .mutate(value)
            .then(value => onChange?.(value))
            .catch(() => {});
        }}
      >
        Change path
      </Button>
    </div>
  );
};
