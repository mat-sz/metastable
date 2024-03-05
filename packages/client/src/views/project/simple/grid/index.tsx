import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { TRPC } from '$api';
import styles from './index.module.scss';
import { Lightbox } from './Lightbox';
import { useSimpleProject } from '../../context';

export const Grid: React.FC = observer(() => {
  const project = useSimpleProject();
  const allOutputsQuery = TRPC.project.output.all.useQuery({
    projectId: project.id,
  });
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const outputs = allOutputsQuery.data?.slice().reverse();

  if (!outputs) {
    return <div>Loading...</div>;
  }

  if (!outputs.length) {
    return <div className={styles.info}>No project output images found.</div>;
  }

  const urls: [string, string][] = outputs.map(filename => [
    project.view('output', filename),
    project.thumb('output', filename),
  ]);

  return (
    <>
      <div className={styles.grid}>
        {urls.map((url, i) => (
          <a
            href={url[0]}
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
            <img src={url[1]} />
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
