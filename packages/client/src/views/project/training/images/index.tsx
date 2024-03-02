import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BsPlus, BsTrash } from 'react-icons/bs';
import { nanoid } from 'nanoid';

import { FilePicker } from '@components/filePicker';
import { IconButton } from '@components/iconButton';
import styles from './index.module.scss';
import { useTraningProject } from '../../context';
import { Settings } from '../settings';
import { FileManager } from './fileManager';
import { UploadQueue, UploadQueueItem } from './UploadQueue';
import { InputEditor } from './InputEditor';

export const Images: React.FC = observer(() => {
  const project = useTraningProject();
  const inputs = [...project.allInputs].reverse();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [editing, setEditing] = useState<string>();

  const items = inputs.map(filename => ({
    id: filename,
    fileUrl: project.view('input', filename),
    thumbnailUrl: project.thumb('input', filename),
  }));

  if (editing) {
    return <InputEditor name={editing} onClose={() => setEditing(undefined)} />;
  }

  return (
    <div className={styles.main}>
      <div className={styles.images}>
        {!!queue.length && (
          <UploadQueue
            items={queue.map(item => ({
              ...item,
              state: project.uploadQueue.includes(item.file)
                ? 'uploading'
                : item.state,
            }))}
            onStart={() => {
              for (const item of queue) {
                project.addInput(item.file);
                URL.revokeObjectURL(item.url);
              }

              setQueue(queue =>
                queue.map(item => ({ ...item, state: 'done' })),
              );
            }}
            onReset={() => {
              setQueue([]);
            }}
            onRemove={id => {
              setQueue(queue => queue.filter(item => item.id !== id));
            }}
          />
        )}
        <FileManager
          items={items}
          onOpen={ids => setEditing(ids[0])}
          actions={
            <>
              <FilePicker
                dropzone
                paste
                onFiles={files => {
                  setQueue(queue => [
                    ...files
                      .map(file => ({
                        id: nanoid(),
                        file,
                        url: URL.createObjectURL(file),
                      }))
                      .reverse(),
                    ...queue,
                  ]);
                }}
              >
                {state => (
                  <button onClick={state.open}>
                    <BsPlus />
                    <span>Add files</span>
                  </button>
                )}
              </FilePicker>
            </>
          }
          selectionActions={selection => (
            <>
              <IconButton
                onClick={() => {
                  for (const item of selection) {
                    project.deleteInput(item.id);
                  }
                }}
              >
                <BsTrash />
              </IconButton>
            </>
          )}
        />
      </div>
      <Settings />
    </div>
  );
});
