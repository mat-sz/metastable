import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { useTraningProject } from '../../context';

export const Images: React.FC = observer(() => {
  const project = useTraningProject();
  const inputs = [...project.allInputs].reverse();
  const [files, setFiles] = useState<File[]>([]);

  const urls = inputs.map(filename => project.view('input', filename));

  return (
    <div className={styles.images}>
      <div className={styles.upload}>
        <input
          type="file"
          multiple
          onChange={e => {
            const list = e.target.files;
            if (list) {
              const files: File[] = [];
              for (let i = 0; i < list.length; i++) {
                const file = list.item(i);
                if (file) {
                  files.push(file);
                }
              }
              setFiles(files);
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
  );
});
