import { DirentType } from '@metastable/types';
import clsx from 'clsx';
import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { InstanceSelectPath } from '$modals/instance';
import { modalStore } from '$stores/ModalStore';
import { IS_ELECTRON } from '$utils/config';
import styles from './index.module.scss';

export interface PathInputProps {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
  type?: DirentType;
}

export const PathInput: React.FC<PathInputProps> = ({
  className,
  value,
  onChange,
  type = DirentType.DIRECTORY,
}) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      <input type="text" readOnly value={value} />
      <Button
        onClick={() => {
          if (IS_ELECTRON) {
            API.electron.shell.selectDirectory
              .mutate(value)
              .then(value => onChange?.(value))
              .catch(() => {});
          } else {
            modalStore.show(
              <InstanceSelectPath
                value={value}
                onChange={onChange}
                type={type}
              />,
            );
          }
        }}
      >
        Change path
      </Button>
    </div>
  );
};
