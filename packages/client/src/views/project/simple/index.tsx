import { TaskState } from '@metastable/types';
import clsx from 'clsx';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { Suspense } from 'react';
import {
  BsArrowLeft,
  BsGrid,
  BsHourglass,
  BsPencil,
  BsXCircleFill,
} from 'react-icons/bs';

import { ProgressCircle } from '$components/progressCircle';
import { MAX_DISPLAY_OUTPUTS } from '$stores/project/simple';
import { resolveImage } from '$utils/url';
import { Grid } from './grid';
import { Images } from './images';
import styles from './index.module.scss';
import { useSimpleProject } from '../context';

const ImageEditor = React.lazy(() => import('./editor'));

export const SimpleProjectView: React.FC = observer(() => {
  const project = useSimpleProject();
  const tabs: Record<string, JSX.Element> = {
    images: <Images />,
    grid: <Grid />,
    editor: <ImageEditor />,
  };

  const allOutputs = project.files.output;
  const outputs = [...allOutputs].reverse().slice(0, MAX_DISPLAY_OUTPUTS);
  const remainingOutputs = Math.max(allOutputs.length - MAX_DISPLAY_OUTPUTS, 0);

  return (
    <div className={styles.project}>
      <div className={styles.sidebar}>
        {project.mode !== 'images' && (
          <div className={styles.back}>
            <div
              className={styles.button}
              role="button"
              onClick={() =>
                runInAction(() => {
                  project.mode = 'images';
                })
              }
              title="Back"
            >
              <BsArrowLeft />
            </div>
          </div>
        )}
        <div className={styles.generated}>
          {!!project.tasks.length && (
            <ul className={styles.queue}>
              {project.tasks.map(item => (
                <li
                  className={clsx({
                    [styles.failed]: item.state === TaskState.FAILED,
                  })}
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
                  onPointerUp={e => {
                    if (e.pointerType === 'mouse' && e.button === 1) {
                      e.stopPropagation();
                      project.dismissTask(item.id);
                    }
                  }}
                  role="button"
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
          {!!outputs.length && (
            <ul className={styles.recent}>
              {outputs.map(output => (
                <li
                  className={clsx({
                    [styles.active]:
                      project.mode === 'images' &&
                      output.mrn === project.currentOutput?.mrn,
                  })}
                  key={output.name}
                  style={{
                    backgroundImage: `url(${CSS.escape(
                      resolveImage(output.mrn, 'thumbnail')!,
                    )})`,
                  }}
                  onClick={() => {
                    project.selectOutput(output);
                  }}
                  role="button"
                />
              ))}
              {!!remainingOutputs && (
                <li
                  className={clsx({
                    [styles.active]: project.mode === 'grid',
                  })}
                  onClick={() => {
                    runInAction(() => {
                      project.mode = 'grid';
                    });
                  }}
                  role="button"
                >
                  <div className={styles.more}>+{remainingOutputs}</div>
                </li>
              )}
            </ul>
          )}
        </div>
        <div className={styles.actions}>
          <ul className={styles.modes}>
            <li
              onClick={() =>
                runInAction(() => {
                  project.mode = 'grid';
                })
              }
              className={clsx({
                [styles.active]: project.mode === 'grid',
              })}
              title="Grid"
              role="button"
            >
              <BsGrid />
            </li>
            <li
              onClick={() =>
                runInAction(() => {
                  project.mode = 'editor';
                })
              }
              className={clsx({
                [styles.active]: project.mode === 'editor',
              })}
              title="Editor"
              role="button"
            >
              <BsPencil />
            </li>
          </ul>
        </div>
      </div>
      <Suspense fallback="Loading...">{tabs[project.mode]}</Suspense>
    </div>
  );
});
