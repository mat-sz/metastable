import { TaskState } from '@metastable/types';
import clsx from 'clsx';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { BsBox, BsGearFill, BsHouseFill, BsX } from 'react-icons/bs';

import { ProgressBar } from '$components/progressBar';
import { mainStore } from '$stores/MainStore';
import type { BaseProject } from '$stores/project';
import { Controls } from './Controls';
import styles from './TabBar.module.scss';

const TAB_ITEM = 'project_tab';

export const ProjectTab: React.FC<{ project: BaseProject }> = observer(
  ({ project }) => {
    const ref = useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag(() => ({
      type: TAB_ITEM,
      item: project,
      collect: monitor => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));
    const [, drop] = useDrop(
      () => ({
        accept: TAB_ITEM,
        drop: (item: BaseProject) => {
          mainStore.projects.move(item.id, project.id);
        },
      }),
      [],
    );

    drag(drop(ref));

    const max = project.progressMax;
    const value = project.progressValue;
    const marquee = project.progressMarquee;

    return (
      <div
        ref={ref}
        className={clsx(styles.tab, styles.projectTab, {
          [styles.selected]:
            mainStore.view === 'project' &&
            mainStore.projects.currentId === project.id,
        })}
        onClick={() => mainStore.projects.select(project.id)}
        onPointerUp={e => {
          if (e.pointerType === 'mouse' && e.button === 1) {
            e.stopPropagation();
            mainStore.projects.close(project.id);
          }
        }}
        style={{
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        {!!project.queueCount && (
          <span className={styles.tabBadge}>{project.queueCount}</span>
        )}
        {!!(max || marquee) && (
          <ProgressBar
            className={styles.tabProgress}
            value={value}
            max={max}
            marquee={marquee}
          />
        )}
        <span>{project.name}</span>
        <button
          onClick={e => {
            e.stopPropagation();
            mainStore.projects.close(project.id);
          }}
        >
          <BsX />
        </button>
      </div>
    );
  },
);

export const ViewTab: React.FC<
  React.PropsWithChildren<{
    viewId: string;
    badge?: string | number;
    value?: number;
    max?: number;
    marquee?: boolean;
  }>
> = observer(({ viewId, badge, value, max, marquee, children }) => {
  return (
    <div
      className={clsx(styles.tab, {
        [styles.selected]: mainStore.view === viewId,
      })}
      onClick={() =>
        runInAction(() => {
          mainStore.view = viewId;
        })
      }
    >
      {!!badge && <span className={styles.tabBadge}>{badge}</span>}
      {!!(max || marquee) && (
        <ProgressBar
          className={styles.tabProgress}
          value={value}
          max={max}
          marquee={marquee}
        />
      )}
      <span>{children}</span>
    </div>
  );
});

export const TabBar: React.FC = observer(() => {
  const [, drop] = useDrop(
    () => ({
      accept: TAB_ITEM,
      drop: (item: BaseProject, monitor) => {
        if (!monitor.isOver()) {
          return;
        }

        mainStore.projects.move(item.id);
      },
    }),
    [],
  );

  const downloads = mainStore.tasks.downloads;
  const remaining = downloads.filter(
    item =>
      item.state === TaskState.RUNNING ||
      item.state === TaskState.PREPARING ||
      item.state === TaskState.QUEUED,
  );
  const downloadValue = remaining.reduce(
    (total, item) => total + item.data.offset,
    0,
  );
  const downloadMax = remaining.reduce(
    (total, item) => total + item.data.size,
    0,
  );

  return (
    <div ref={drop} className={styles.tabs}>
      <div className={styles.logo}>Metastable</div>
      <ViewTab viewId="home">
        <BsHouseFill />
      </ViewTab>
      <ViewTab viewId="settings">
        <BsGearFill />
      </ViewTab>
      <ViewTab
        viewId="models"
        badge={remaining.length}
        value={downloadValue}
        max={downloadMax}
      >
        <BsBox />
      </ViewTab>
      {mainStore.projects.projects.map(project => (
        <ProjectTab key={project.id} project={project} />
      ))}
      <Controls />
    </div>
  );
});
