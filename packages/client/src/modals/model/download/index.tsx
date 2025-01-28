import { DownloadSettings } from '@metastable/types';
import { toJS } from 'mobx';
import React, { useEffect, useState } from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { Tag } from '$components/tag';
import { VarArray, VarSelect, VarUI } from '$components/var';
import { mainStore } from '$stores/MainStore';
import { filesize } from '$utils/file';
import styles from './index.module.scss';

export interface DownloadFileState {
  settings: DownloadSettings;
  state: 'downloaded' | 'queued' | 'failed' | 'not_queued';
  size?: number;
  offset?: number;
  error?: string;
}

interface Props {
  downloads: DownloadFileState[];
  onDownload?: () => void;
}

export const ModelDownload: React.FC<Props> = ({ downloads, onDownload }) => {
  const { close } = useModal();
  const [data, setData] = useState(toJS(downloads));

  useEffect(() => {
    setData(toJS(downloads));
  }, [downloads, setData]);

  return (
    <Modal title="Download model" size="small">
      <div>Would you like to download the following files?</div>
      <ul className={styles.list}>
        <VarUI values={data} onChange={setData}>
          <VarArray path="">
            {({ element }) => {
              const download = element as DownloadFileState;
              const folders =
                mainStore.config.data?.modelFolders?.[download.settings.type] ||
                [];

              return (
                <li>
                  <div>{download.settings.name}</div>
                  {download.settings.size ? (
                    <Tag>{filesize(download.settings.size)}</Tag>
                  ) : undefined}
                  <VarSelect
                    path="settings.folder"
                    value="default"
                    options={[
                      { key: 'default', label: 'Default location' },
                      ...folders.map(item => ({
                        key: item.name,
                        label: item.name,
                      })),
                    ]}
                  ></VarSelect>
                </li>
              );
            }}
          </VarArray>
        </VarUI>
      </ul>
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
          onClick={() => {
            for (const file of data) {
              mainStore.tasks.download({
                ...file.settings,
                folder:
                  file.settings.folder === 'default'
                    ? undefined
                    : file.settings.folder,
              });
            }

            onDownload?.();
            close();
          }}
        >
          Download
        </Button>
      </ModalActions>
    </Modal>
  );
};
