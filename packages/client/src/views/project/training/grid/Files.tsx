import { ProjectFileType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { BsPlus, BsTrash } from 'react-icons/bs';

import { FileManager, FileManagerItem } from '$components/fileManager';
import { FilePicker } from '$components/filePicker';
import { UploadQueue } from '$components/uploadQueue';
import { useModal } from '$hooks/useModal';
import { ProjectDeleteFile } from '$modals/project/deleteFile';
import { resolveImage } from '$utils/url';
import styles from './index.module.scss';
import { useProject } from '../../context';
import { InputEditor } from '../common/InputEditor';

interface Props {
  type: ProjectFileType;
  allowUpload?: boolean;
}

const FilesUpload: React.FC<Props> = observer(({ type }) => {
  const project = useProject();
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

  const project = useProject();
  const files = project.files[type];
  const mappedFiles: FileManagerItem[] = files.map(file => ({
    name: file.name,
    url: resolveImage(file.mrn),
    thumbnailUrl: resolveImage(file.mrn, 'thumbnail'),
  }));

  const { show } = useModal((selection: FileManagerItem[]) => (
    <ProjectDeleteFile
      count={selection.length}
      onDelete={async () => {
        for (const item of selection) {
          project.deleteFile(type, item.name);
        }
      }}
    />
  ));

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
            <button onClick={() => show(selection)}>
              <BsTrash />
              <span>Delete</span>
            </button>
          </>
        )}
        actions={<>{allowUpload && <FilesUpload type={type} />}</>}
      />
      {open && (
        <InputEditor input={files[current]} onClose={() => setOpen(false)} />
      )}
    </div>
  );
});
