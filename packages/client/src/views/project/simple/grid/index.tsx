import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  BsArrowRightSquareFill,
  BsFolderFill,
  BsGearFill,
} from 'react-icons/bs';

import { API } from '$api';
import { IconButton } from '$components/iconButton';
import { IS_ELECTRON } from '$utils/config';
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
          actions={file => {
            return (
              <>
                <IconButton
                  title="Use as input image"
                  onClick={async () => {
                    project.useInputImage(file.image.url);
                  }}
                >
                  <BsArrowRightSquareFill />
                </IconButton>
                {IS_ELECTRON && (
                  <IconButton
                    title="Reveal in explorer"
                    onClick={() => {
                      API.electron.shell.showItemInFolder.mutate(file.path);
                    }}
                  >
                    <BsFolderFill />
                  </IconButton>
                )}
                <IconButton
                  title="Load settings from current image"
                  onClick={async () => {
                    const data = await API.project.output.get.query({
                      projectId: project.id,
                      name: file.name,
                    });
                    const settings = data.metadata as any;
                    if (settings) {
                      project.setSettings(settings);
                    }
                  }}
                >
                  <BsGearFill />
                </IconButton>
              </>
            );
          }}
        />
      )}
    </>
  );
});
