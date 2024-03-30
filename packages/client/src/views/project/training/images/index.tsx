import { ImageFile } from '@metastable/types';
import { Base64 } from 'js-base64';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { BsPlus, BsTagFill, BsTrash } from 'react-icons/bs';

import { FilePicker } from '$components/filePicker';
import { useUI } from '$components/ui';
import { Tagger } from '$modals/tagger';
import { FileManager } from './fileManager';
import styles from './index.module.scss';
import { InputEditor } from './InputEditor';
import { UploadQueue, UploadQueueItem } from './UploadQueue';
import { useTraningProject } from '../../context';
import { Settings } from '../settings';

import { TRPC } from '$api';

export const Images: React.FC = observer(() => {
  const { showModal } = useUI();
  const project = useTraningProject();
  const allInputsQuery = TRPC.project.input.all.useQuery({
    projectId: project.id,
  });
  const createInputMutation = TRPC.project.input.create.useMutation();
  const deleteInputMutation = TRPC.project.input.delete.useMutation();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [editing, setEditing] = useState<ImageFile>();

  if (editing) {
    return (
      <InputEditor input={editing} onClose={() => setEditing(undefined)} />
    );
  }

  const inputs = allInputsQuery.data;
  if (!inputs) {
    return <div>Loading...</div>;
  }

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
              await allInputsQuery.refetch();
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
          items={inputs}
          onOpen={ids => setEditing(inputs.find(item => item.name === ids[0]))}
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
              <button
                onClick={() => {
                  showModal(
                    <Tagger
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
                    await deleteInputMutation.mutateAsync({
                      projectId: project.id,
                      name: item.name,
                    });
                  }
                  await allInputsQuery.refetch();
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
