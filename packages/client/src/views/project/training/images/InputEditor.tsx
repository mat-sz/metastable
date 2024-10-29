import {
  ImageFile,
  ProjectFileType,
  ProjectTrainingInputMetadata,
} from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { BsX } from 'react-icons/bs';

import { TRPC } from '$api';
import { IconButton } from '$components/iconButton';
import { ImageCrop } from '$components/imageCrop';
import { resolveImage } from '$utils/url';
import styles from './index.module.scss';
import { useTraningProject } from '../../context';

interface InputEditorProps {
  input: ImageFile;
  onClose?: () => void;
}

export const InputEditor: React.FC<InputEditorProps> = observer(
  ({ input, onClose }) => {
    const project = useTraningProject();
    const metadataQuery = TRPC.project.file.get.useQuery({
      type: ProjectFileType.INPUT,
      projectId: project.id,
      name: input.name,
    });
    const metadataMutation = TRPC.project.file.update.useMutation();
    const [metadata, setMetadata] = useState<ProjectTrainingInputMetadata>({});

    useEffect(() => {
      if (metadataQuery.data) {
        setMetadata(metadataQuery.data.metadata as any);
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
                  type: ProjectFileType.INPUT,
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
            src={resolveImage(input.mrn)}
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
