import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BsFloppy, BsX } from 'react-icons/bs';
import { ProjectTrainingInputMetadata } from '@metastable/types';

import { TRPC } from '$api';
import { ImageCrop } from '$components/imageCrop';
import { IconButton } from '$components/iconButton';
import styles from './index.module.scss';
import { useTraningProject } from '../../context';

interface InputEditorProps {
  name: string;
  onClose?: () => void;
}

export const InputEditor: React.FC<InputEditorProps> = observer(
  ({ name, onClose }) => {
    const project = useTraningProject();
    const url = project.view('input', name);
    const metadataQuery = TRPC.project.input.get.useQuery({
      projectId: project.id,
      name,
    });
    const metadataMutation = TRPC.project.input.update.useMutation();
    const [metadata, setMetadata] = useState<ProjectTrainingInputMetadata>({});

    useEffect(() => {
      if (metadataQuery.data) {
        setMetadata(metadataQuery.data.metadata);
      }
    }, [metadataQuery.data, setMetadata]);

    if (!metadataQuery.data) {
      return <div>Loading...</div>;
    }

    return (
      <div className={styles.editor}>
        <div className={styles.header}>
          <span></span>
          <span>{name}</span>
          <div>
            <IconButton
              onClick={async () => {
                metadataMutation.mutate({
                  projectId: project.id,
                  name,
                  metadata,
                });
              }}
            >
              <BsFloppy />
            </IconButton>
            <IconButton onClick={onClose}>
              <BsX />
            </IconButton>
          </div>
        </div>
        <div className={styles.crop}>
          <ImageCrop
            src={url}
            defaultArea={(metadataQuery.data.metadata as any).crop}
            onChange={area => {
              setMetadata(metadata => ({ ...metadata, crop: area }));
            }}
          />
        </div>
        <div className={styles.caption}>
          <textarea
            value={metadata.caption || ''}
            onChange={e => {
              setMetadata(metadata => ({
                ...metadata,
                caption: e.target.value,
              }));
            }}
          />
        </div>
      </div>
    );
  },
);
