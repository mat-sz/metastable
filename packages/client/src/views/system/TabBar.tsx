import { TaskState } from '@metastable/types';
import clsx from 'clsx';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { BsBox, BsGearFill, BsHouseFill, BsPlusLg, BsX } from 'react-icons/bs';

import logo from '$/assets/logo.svg';
import { ProgressBar } from '$components/progressBar';
import { mainStore } from '$stores/MainStore';
import type { BaseProject } from '$stores/project';
import { Controls } from './Controls';
import styles from './TabBar.module.scss';

const TAB_ITEM = 'project_tab';

interface BaseTabProps {
  badge?: string | number;
  value?: number;
  max?: number;
  marquee?: boolean;
  isSelected?: boolean;
  opacity?: number;
  onClick?: () => void;
  onClose?: () => void;
}

export const BaseTab = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<BaseTabProps>
>(
  (
    {
      badge,
      value,
      max,
      marquee,
      isSelected,
      children,
      onClick,
      onClose,
      opacity,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(styles.tab, {
          [styles.selected]: isSelected,
        })}
        onClick={onClick}
        onPointerUp={e => {
          if (e.pointerType === 'mouse' && e.button === 1) {
            e.stopPropagation();
            onClose?.();
          }
        }}
        style={{ opacity }}
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
        {onClose && (
          <button
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
          >
            <BsX />
          </button>
        )}
      </div>
    );
  },
);

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
      <BaseTab
        ref={ref}
        isSelected={
          mainStore.view === 'project' &&
          mainStore.projects.currentId === project.id
        }
        opacity={isDragging ? 0.5 : 1}
        onClick={() => mainStore.projects.select(project.id)}
        onClose={() => project.close()}
        badge={project.queueCount}
        value={value}
        max={max}
        marquee={marquee}
      >
        {project.name}
      </BaseTab>
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
    <BaseTab
      onClick={() =>
        runInAction(() => {
          mainStore.view = viewId;
        })
      }
      badge={badge}
      value={value}
      max={max}
      marquee={marquee}
      isSelected={mainStore.view === viewId}
    >
      {children}
    </BaseTab>
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
      <div className={styles.logo}>
        <img src={logo} alt="Logo" /> Metastable
      </div>
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
      <BaseTab
        onClick={() => mainStore.projects.create(undefined, 'simple', true)}
      >
        <BsPlusLg />
      </BaseTab>
      <Controls />
    </div>
  );
});
