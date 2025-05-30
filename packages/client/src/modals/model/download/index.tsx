import { toJS } from 'mobx';
import React, { useEffect, useState } from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { Tag } from '$components/tag';
import { VarArray, VarSelect, VarUI } from '$components/var';
import { useConfigStore } from '$store/config';
import { mainStore } from '$stores/MainStore';
import { DownloadFileInfo } from '$types/download';
import { filesize } from '$utils/file';
import styles from './index.module.scss';

interface Props {
  downloads: DownloadFileInfo[];
  onDownload?: () => void;
}

export const ModelDownload: React.FC<Props> = ({ downloads, onDownload }) => {
  const [data, setData] = useState(toJS(downloads));
  const modelFolders = useConfigStore(state => state.data?.modelFolders);

  useEffect(() => {
    setData(toJS(downloads));
  }, [downloads, setData]);

  return (
    <Modal
      title="Download model"
      size="small"
      onSubmit={() => {
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
      }}
    >
      <div>Would you like to download the following files?</div>
      <ul className={styles.list}>
        <VarUI values={data} onChange={setData}>
          <VarArray path="">
            {({ element }) => {
              const download = element as DownloadFileInfo;
              const folders = modelFolders?.[download.settings.type] || [];

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
        <Button variant="primary">Download</Button>
      </ModalActions>
    </Modal>
  );
};
