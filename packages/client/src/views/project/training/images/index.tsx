import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BsPlus, BsTrash } from 'react-icons/bs';
import { nanoid } from 'nanoid';
import { Base64 } from 'js-base64';

import { TRPC } from '@api';
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
  const allInputsQuery = TRPC.project.input.all.useQuery({
    projectId: project.id,
  });
  const createInputMutation = TRPC.project.input.create.useMutation();
  const deleteInputMutation = TRPC.project.input.delete.useMutation();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [editing, setEditing] = useState<string>();

  if (editing) {
    return <InputEditor name={editing} onClose={() => setEditing(undefined)} />;
  }

  const inputs = allInputsQuery.data;
  if (!inputs) {
    return <div>Loading...</div>;
  }

  const items = inputs.map(filename => ({
    id: filename,
    fileUrl: project.view('input', filename),
    thumbnailUrl: project.thumb('input', filename),
  }));

  return (
    <div className={styles.main}>
      <div className={styles.images}>
        {!!queue.length && (
          <UploadQueue
            items={queue.map(item => ({
              ...item,
            }))}
            onStart={async () => {
              for (const item of queue) {
                setQueue(queue =>
                  queue.map(queueItem =>
                    queueItem.id === item.id
                      ? { ...queueItem, state: 'uploading' }
                      : queueItem,
                  ),
                );
                await createInputMutation.mutateAsync({
                  projectId: project.id,
                  data: Base64.fromUint8Array(
                    new Uint8Array(await item.file.arrayBuffer()),
                  ),
                  name: item.file.name,
                });
                URL.revokeObjectURL(item.url);
                setQueue(queue =>
                  queue.map(queueItem =>
                    queueItem.id === item.id
                      ? { ...queueItem, state: 'done' }
                      : queueItem,
                  ),
                );
              }
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
                    deleteInputMutation.mutate({
                      projectId: project.id,
                      name: item.id,
                    });
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
