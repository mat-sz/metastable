import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { useTraningProject } from '../../context';
import { Settings } from '../settings';

export const Images: React.FC = observer(() => {
  const project = useTraningProject();
  const inputs = [...project.allInputs].reverse();
  const [files, setFiles] = useState<File[]>([]);

  const urls = inputs.map(filename => project.view('input', filename));

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
        <div className={styles.grid}>
          {urls.map((url, i) => (
            <a href={url} target="_blank" rel="noopener noreferrer" key={i}>
              <img src={url} />
            </a>
          ))}
          {!inputs.length && (
            <div className={styles.info}>No input images found.</div>
          )}
        </div>
      </div>
      <Settings />
    </div>
  );
});
