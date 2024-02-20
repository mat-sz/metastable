import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { useTraningProject } from '../../context';
import { Settings } from '../settings';
import { FileManager } from './fileManager';

export const Images: React.FC = observer(() => {
  const project = useTraningProject();
  const inputs = [...project.allInputs].reverse();
  const [files, setFiles] = useState<File[]>([]);

  const items = inputs.map(filename => ({
    id: filename,
    fileUrl: project.view('input', filename),
    thumbnailUrl: project.thumb('input', filename),
  }));

  return (
    <div className={styles.main}>
      <div className={styles.images}>
        <div className={styles.upload}>
          <input
            type="file"
            multiple
            onChange={e => {
              if (e.target.files) {
                setFiles([...e.target.files]);
              }
              e.target.value = '';
            }}
          />
          <span>
            {files.length} selected / {project.uploadQueue.length} queued
          </span>
          <button
            onClick={() => {
              for (const file of files) {
                project.addInput(file);
              }
              setFiles([]);
            }}
          >
            Upload
          </button>
        </div>
        <FileManager items={items} />
      </div>
      <Settings />
    </div>
  );
});
