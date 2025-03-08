import { DirentType } from '@metastable/types';
import React, { useState } from 'react';
import {
  BsArrow90DegUp,
  BsChevronRight,
  BsFile,
  BsFolder,
  BsFolderPlus,
} from 'react-icons/bs';

import { TRPC } from '$api';
import { Alert } from '$components/alert';
import { Button } from '$components/button';
import { IconButton } from '$components/iconButton';
import { LoadingOverlay } from '$components/loadingOverlay';
import { Modal, ModalActions } from '$components/modal';
import { useModal, useModalContext } from '$hooks/useModal';
import styles from './index.module.scss';
import { InstanceNewFolder } from '../newFolder';

interface Props {
  value: string;
  type?: DirentType;
  onChange?: (value: string) => void;
}

export const InstanceSelectPath: React.FC<Props> = ({
  value,
  type,
  onChange,
}) => {
  const { close } = useModalContext();
  const [path, setPath] = useState(value);
  const { show } = useModal(<InstanceNewFolder path={path} onSave={setPath} />);

  const { data, error, isLoading, isSuccess } =
    TRPC.instance.listFiles.useQuery(path);

  let items = data?.items;
  if (type) {
    items = items?.filter(item => item.type === type);
  }

  return (
    <Modal title="Choose path" size="small">
      <div className={styles.picker}>
        {isLoading && <LoadingOverlay className={styles.loading} />}
        <div className={styles.current}>
          {!!data && (
            <>
              <div className={styles.actions}>
                <IconButton
                  onClick={() => setPath(data.parentPath)}
                  disabled={data.path === data.parentPath}
                  title="Go up"
                >
                  <BsArrow90DegUp />
                </IconButton>
              </div>
              <ul className={styles.segments}>
                {data.segments.map(segment => (
                  <li key={segment.path}>
                    <span
                      className={styles.name}
                      onClick={() => setPath(segment.path)}
                    >
                      {segment.name}
                    </span>
                    <BsChevronRight />
                  </li>
                ))}
              </ul>
              <div className={styles.actions}>
                <IconButton onClick={show} title="New folder">
                  <BsFolderPlus />
                </IconButton>
              </div>
            </>
          )}
        </div>
        <div className={styles.items}>
          {!!error && <Alert variant="error">{error.message}</Alert>}
          {items?.length ? (
            <ul>
              {items.map(item => (
                <li key={item.path} onClick={() => setPath(item.path)}>
                  {item.type === 'directory' ? <BsFolder /> : <BsFile />}
                  <span className={styles.name}>{item.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>This folder is empty.</div>
          )}
        </div>
      </div>
      <ModalActions>
        <Button
          variant="secondary"
          onClick={() => {
            close();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!isSuccess}
          onClick={() => {
            onChange?.(path);
            close();
          }}
        >
          Select folder
        </Button>
      </ModalActions>
    </Modal>
  );
};
