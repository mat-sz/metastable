import { TaskState } from '@metastable/types';
import clsx from 'clsx';
import { glueIsWebGLAvailable } from 'fxglue';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { Suspense } from 'react';
import { BsGrid, BsHourglass, BsPencil, BsXCircleFill } from 'react-icons/bs';

import { ProgressCircle } from '$components/progressCircle';
import { Grid } from './grid';
import { Images } from './images';
import styles from './index.module.scss';
import { useSimpleProject } from '../context';

const ImageEditor = React.lazy(() => import('./editor'));

const MAX_DISPLAY_OUTPUTS = 25;
const EDITOR_AVAILABLE = glueIsWebGLAvailable();

export const SimpleProjectView: React.FC = observer(() => {
  const project = useSimpleProject();
  const tabs: Record<string, JSX.Element> = {
    images: <Images />,
    grid: <Grid />,
    editor: <ImageEditor />,
  };

  const outputs = [...project.outputs].reverse().slice(0, MAX_DISPLAY_OUTPUTS);
  const remainingOutputs = Math.max(
    project.outputs.length - MAX_DISPLAY_OUTPUTS,
    0,
  );

  return (
    <div className={styles.project}>
      <div className={styles.sidebar}>
        <div className={styles.generated}>
          {!!project.prompts.length && (
            <ul className={styles.queue}>
              {project.prompts.map(item => (
                <li
                  className={styles.item}
                  key={item.id}
                  style={{
                    backgroundImage: item.data.preview
                      ? `url(${item.data.preview})`
                      : undefined,
                  }}
                  onClick={() => {
                    if (item.state === TaskState.FAILED) {
                      project.selectTask(item);
                    } else {
                      project.selectOutput(undefined);
                    }
                  }}
                >
                  <div className={styles.status}>
                    {item.progress ? (
                      <ProgressCircle value={item.progress} max={1} />
                    ) : item.state === TaskState.FAILED ? (
                      <BsXCircleFill />
                    ) : (
                      <BsHourglass />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ul className={styles.recent}>
            {outputs.map(output => (
              <li
                className={clsx(styles.item, {
                  [styles.active]:
                    project.mode === 'images' &&
                    output.image.url === project.currentOutput?.image.url,
                })}
                key={output.name}
                style={{
                  backgroundImage: `url(${CSS.escape(
                    output.image.thumbnailUrl,
                  )})`,
                }}
                onClick={() => {
                  project.selectOutput(output);
                }}
              />
            ))}
            {!!remainingOutputs && (
              <li
                className={clsx(styles.item, {
                  [styles.active]: project.mode === 'grid',
                })}
                onClick={() => {
                  runInAction(() => {
                    project.mode = 'grid';
                  });
                }}
              >
                <div className={styles.more}>+{remainingOutputs}</div>
              </li>
            )}
          </ul>
        </div>
        <div className={styles.actions}>
          <ul className={styles.modes}>
            <li
              onClick={() =>
                runInAction(() => {
                  project.mode = 'grid';
                })
              }
              className={clsx(styles.item, {
                [styles.active]: project.mode === 'grid',
              })}
              title="Grid"
            >
              <BsGrid />
            </li>
            {EDITOR_AVAILABLE && (
              <li
                onClick={() =>
                  runInAction(() => {
                    project.mode = 'editor';
                  })
                }
                className={clsx(styles.item, {
                  [styles.active]: project.mode === 'editor',
                })}
                title="Editor"
              >
                <BsPencil />
              </li>
            )}
          </ul>
        </div>
      </div>
      <Suspense fallback="Loading...">{tabs[project.mode]}</Suspense>
    </div>
  );
});
