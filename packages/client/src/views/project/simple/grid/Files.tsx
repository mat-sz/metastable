import { ProjectFileType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { BsPlus, BsTrash } from 'react-icons/bs';

import { FileManager, FileManagerItem } from '$components/fileManager';
import { FilePicker } from '$components/filePicker';
import { UploadQueue } from '$components/uploadQueue';
import { ProjectDeleteFile } from '$modals/project/deleteFile';
import { modalStore } from '$stores/ModalStore';
import { resolveImage } from '$utils/url';
import styles from './index.module.scss';
import { Lightbox } from './Lightbox';
import { useSimpleProject } from '../../context';
import { ImageActions } from '../common/ImageActions';

interface Props {
  type: ProjectFileType;
  allowUpload?: boolean;
}

const FilesUpload: React.FC<Props> = observer(({ type }) => {
  const project = useSimpleProject();
  const queue = project.uploadQueue[type];

  return (
    <FilePicker
      dropzone
      paste
      onFiles={files => {
        if (queue.isRunning) {
          return;
        }

        for (const file of files) {
          queue.add(file);
        }
      }}
      accept="image/*"
    >
      {state => (
        <button onClick={state.open} disabled={queue.isRunning}>
          <BsPlus />
          <span>Add files</span>
        </button>
      )}
    </FilePicker>
  );
});

export const Files: React.FC<Props> = observer(({ type, allowUpload }) => {
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const project = useSimpleProject();
  const files = project.files[type];
  const mappedFiles: FileManagerItem[] = files.map(file => ({
    name: file.name,
    url: resolveImage(file.mrn),
    thumbnailUrl: resolveImage(file.mrn, 'thumbnail'),
  }));

  return (
    <div className={styles.grid}>
      {allowUpload && <UploadQueue queue={project.uploadQueue[type]} />}
      <FileManager
        className={styles.manager}
        items={mappedFiles}
        onOpen={ids => {
          setCurrent(files.findIndex(item => item.name === ids[0]) || 0);
          setOpen(true);
        }}
        selectionActions={selection => (
          <>
            <button
              onClick={() => {
                modalStore.show(
                  <ProjectDeleteFile
                    count={selection.length}
                    onDelete={async () => {
                      for (const item of selection) {
                        project.deleteFile(type, item.name);
                      }
                    }}
                  />,
                );
              }}
            >
              <BsTrash />
              <span>Delete</span>
            </button>
          </>
        )}
        actions={<>{allowUpload && <FilesUpload type={type} />}</>}
      />
      {open && (
        <Lightbox
          current={current}
          images={files}
          onChange={setCurrent}
          onClose={() => setOpen(false)}
          actions={file => {
            return <ImageActions file={file} type={type} />;
          }}
        />
      )}
    </div>
  );
});
