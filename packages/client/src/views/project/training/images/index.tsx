import { ImageFile, ProjectFileType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { BsPlus, BsTagFill, BsTrash } from 'react-icons/bs';

import { FileManager, FileManagerItem } from '$components/fileManager';
import { FilePicker } from '$components/filePicker';
import { UploadQueue } from '$components/uploadQueue';
import { ProjectTagger } from '$modals/project';
import { modalStore } from '$stores/ModalStore';
import { resolveImage } from '$utils/url';
import styles from './index.module.scss';
import { InputEditor } from './InputEditor';
import { useTraningProject } from '../../context';
import { Settings } from '../settings';

export const Images: React.FC = observer(() => {
  const project = useTraningProject();
  const [editing, setEditing] = useState<ImageFile>();
  const type = ProjectFileType.INPUT;
  const queue = project.uploadQueue[type];

  if (editing) {
    return (
      <InputEditor input={editing} onClose={() => setEditing(undefined)} />
    );
  }

  const inputs = project.files[type];
  const mappedFiles: FileManagerItem[] = inputs.map(file => ({
    name: file.name,
    url: resolveImage(file.mrn),
    thumbnailUrl: resolveImage(file.mrn, 'thumbnail'),
  }));

  return (
    <div className={styles.main}>
      <div className={styles.images}>
        <UploadQueue queue={queue} />
        <FileManager
          items={mappedFiles}
          onOpen={ids => setEditing(inputs.find(item => item.name === ids[0]))}
          actions={
            <>
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
            </>
          }
          selectionActions={selection => (
            <>
              <button
                onClick={() => {
                  modalStore.show(
                    <ProjectTagger
                      project={project}
                      inputs={selection.map(item => item.name)}
                    />,
                  );
                }}
              >
                <BsTagFill />
                <span>Run tagging</span>
              </button>
              <button
                onClick={async () => {
                  for (const item of selection) {
                    await project.deleteFile(type, item.name);
                  }
                }}
              >
                <BsTrash />
                <span>Delete</span>
              </button>
            </>
          )}
        />
      </div>
      <Settings />
    </div>
  );
});
