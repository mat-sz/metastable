import { ProjectFileType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { BsTrash } from 'react-icons/bs';

import { FileManager } from '$components/fileManager';
import { ProjectFileDelete } from '$modals/projectFileDelete';
import { modalStore } from '$stores/ModalStore';
import styles from './index.module.scss';
import { Lightbox } from './Lightbox';
import { useSimpleProject } from '../../context';
import { ImageActions } from '../common/ImageActions';

interface Props {
  type: ProjectFileType;
}

export const Files: React.FC<Props> = observer(({ type }) => {
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const project = useSimpleProject();
  const files = project.files[type];

  return (
    <div className={styles.grid}>
      <FileManager
        className={styles.manager}
        items={files}
        onOpen={ids => {
          setCurrent(files.findIndex(item => item.name === ids[0]) || 0);
          setOpen(true);
        }}
        selectionActions={selection => (
          <>
            <button
              onClick={() => {
                modalStore.show(
                  <ProjectFileDelete
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
      />
      {open && (
        <Lightbox
          current={current}
          images={files}
          onChange={setCurrent}
          onClose={() => setOpen(false)}
          actions={file => {
            return <ImageActions file={file} />;
          }}
        />
      )}
    </div>
  );
});
