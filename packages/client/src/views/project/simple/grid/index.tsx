import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { Lightbox } from './Lightbox';
import { useSimpleProject } from '../../context';

export const Grid: React.FC = observer(() => {
  const project = useSimpleProject();
  const outputs = [...project.allOutputs].reverse();
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  if (!outputs.length) {
    return <div className={styles.info}>No project output images found.</div>;
  }

  const urls = outputs.map(filename => project.view('output', filename));

  return (
    <>
      <div className={styles.grid}>
        {urls.map((url, i) => (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            key={i}
            onClick={e => {
              if (e.button === 0) {
                setOpen(true);
                setCurrent(i);
                e.preventDefault();
              }
            }}
          >
            <img src={url} />
          </a>
        ))}
      </div>
      {open && (
        <Lightbox
          current={current}
          images={urls}
          onChange={setCurrent}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
});
