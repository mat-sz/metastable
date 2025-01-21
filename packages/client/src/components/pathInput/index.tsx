import { DirentType } from '@metastable/types';
import clsx from 'clsx';
import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { InstanceSelectPath } from '$modals/instance';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { IS_ELECTRON } from '$utils/config';
import styles from './index.module.scss';

export interface PathInputProps {
  value?: string;
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
          const current = value || mainStore.info.defaultDirectory;

          if (IS_ELECTRON) {
            API.electron.shell.selectDirectory
              .mutate(current)
              .then(value => onChange?.(value))
              .catch(() => {});
          } else {
            modalStore.show(
              <InstanceSelectPath
                value={current}
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
