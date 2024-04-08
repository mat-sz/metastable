import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import styles from './index.module.scss';
import { Lightbox } from './Lightbox';
import { useSimpleProject } from '../../context';

export const Grid: React.FC = observer(() => {
  const project = useSimpleProject();
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const outputs = project.outputs.slice().reverse();

  if (!outputs.length) {
    return <div className={styles.info}>No project output images found.</div>;
  }

  return (
    <>
      <div className={styles.grid}>
        {outputs.map((output, i) => (
          <a
            href={output.image.url}
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
            <img src={output.image.thumbnailUrl} />
          </a>
        ))}
      </div>
      {open && (
        <Lightbox
          current={current}
          images={outputs}
          onChange={setCurrent}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
});
