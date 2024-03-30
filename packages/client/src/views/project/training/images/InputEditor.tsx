import { ImageFile, ProjectTrainingInputMetadata } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { ImageCrop } from '$components/imageCrop';
import styles from './index.module.scss';
import { useTraningProject } from '../../context';

import { TRPC } from '$api';

interface InputEditorProps {
  input: ImageFile;
  onClose?: () => void;
}

export const InputEditor: React.FC<InputEditorProps> = observer(
  ({ input, onClose }) => {
    const project = useTraningProject();
    const metadataQuery = TRPC.project.input.get.useQuery({
      projectId: project.id,
      name: input.name,
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
          <span>{input.name}</span>
          <div>
            <IconButton
              onClick={async () => {
                metadataMutation.mutate({
                  projectId: project.id,
                  name: input.name,
                  metadata,
                });
                onClose?.();
              }}
            >
              <BsX />
            </IconButton>
          </div>
        </div>
        <div className={styles.crop}>
          <ImageCrop
            src={input.image.url}
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
