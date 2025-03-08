import { DirentType } from '@metastable/types';
import clsx from 'clsx';
import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { useModal } from '$hooks/useModal';
import { InstanceSelectPath } from '$modals/instance/selectPath';
import { mainStore } from '$stores/MainStore';
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
  const { show } = useModal((current: string) => (
    <InstanceSelectPath value={current} onChange={onChange} type={type} />
  ));

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
            show(current);
          }
        }}
      >
        Change path
      </Button>
    </div>
  );
};
