import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { BsTrash } from 'react-icons/bs';

import { FileManager } from '$components/fileManager';
import styles from './index.module.scss';
import { Lightbox } from './Lightbox';
import { useSimpleProject } from '../../context';
import { ImageActions } from '../common/ImageActions';

export const Grid: React.FC = observer(() => {
  const project = useSimpleProject();
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const outputs = project.outputs.slice().reverse();

  if (!outputs.length) {
    return <div className={styles.info}>No project output images found.</div>;
  }

  return (
    <div className={styles.grid}>
      <FileManager
        items={outputs}
        onOpen={ids => {
          setCurrent(outputs.findIndex(item => item.name === ids[0]) || 0);
          setOpen(true);
        }}
        selectionActions={selection => (
          <>
            <button
              onClick={async () => {
                for (const item of selection) {
                  await project.deleteOutput(item.name);
                }
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
          images={outputs}
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
