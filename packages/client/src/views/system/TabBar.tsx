import { ProjectType, TaskState } from '@metastable/types';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useRef } from 'react';
import {
  BsBoxFill,
  BsGearFill,
  BsHouseFill,
  BsPlusLg,
  BsXLg,
} from 'react-icons/bs';

import { ContextMenuItem, useContextMenu } from '$components/contextMenu';
import { ProgressBar } from '$components/progressBar';
import { ProjectMenu } from '$components/projectMenu';
import { useDrag, useDrop } from '$hooks/dnd';
import { useHorizontalScroll } from '$hooks/useHorizontalScroll';
import { useHotkey } from '$hooks/useHotkey';
import { mainStore } from '$stores/MainStore';
import type { BaseProject } from '$stores/project';
import { uiStore, ViewName } from '$stores/UIStore';
import { IS_DEV, IS_ELECTRON, IS_MAC } from '$utils/config';
import { Controls } from './Controls';
import { Logo } from './Logo';
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
  onClose?: (shiftPressed: boolean) => void;
  menu?: React.ReactNode;
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
      menu,
    },
    ref,
  ) => {
    const { contextMenu, onContextMenu } = useContextMenu(menu);

    return (
      <div
        ref={ref}
        className={clsx(styles.tab, {
          [styles.selected]: isSelected,
        })}
        onContextMenu={onContextMenu}
        onClick={onClick}
        onPointerUp={e => {
          if (e.pointerType === 'mouse' && e.button === 1) {
            e.stopPropagation();
            onClose?.(e.shiftKey);
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
              onClose(e.shiftKey);
            }}
          >
            <BsXLg />
          </button>
        )}
        {contextMenu}
      </div>
    );
  },
);

interface ProjectDragItem {
  id: string;
}

export const ProjectTab: React.FC<{ project: BaseProject }> = observer(
  ({ project }) => {
    const ref = useRef<HTMLDivElement>(null);

    const { isDragging, connect: drag } = useDrag(() => ({
      type: TAB_ITEM,
      item: { id: project.id } as ProjectDragItem,
    }));
    const { isOver, connect: drop } = useDrop(
      () => ({
        accept: TAB_ITEM,
        drop: (item: ProjectDragItem) => {
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
          uiStore.view === 'project' &&
          mainStore.projects.currentId === project.id
        }
        opacity={isDragging || isOver ? 0.5 : 1}
        onClick={() => mainStore.projects.select(project.id)}
        onClose={shiftPressed => project.close(shiftPressed)}
        badge={project.queueCount}
        value={value}
        max={max}
        marquee={marquee}
        menu={<ProjectMenu projectId={project.id} isTab />}
      >
        {project.name}
      </BaseTab>
    );
  },
);

export const ViewTab: React.FC<
  React.PropsWithChildren<{
    viewId: ViewName;
    badge?: string | number;
    value?: number;
    max?: number;
    marquee?: boolean;
  }>
> = observer(({ viewId, badge, value, max, marquee, children }) => {
  return (
    <BaseTab
      onClick={() => uiStore.setView(viewId)}
      badge={badge}
      value={value}
      max={max}
      marquee={marquee}
      isSelected={uiStore.view === viewId}
    >
      {children}
    </BaseTab>
  );
});

export const TabBar: React.FC = observer(() => {
  const { connect: drop } = useDrop(
    () => ({
      accept: TAB_ITEM,
      drop: (item: BaseProject) => {
        mainStore.projects.move(item.id);
      },
    }),
    [],
  );
  const horizontalScroll = useHorizontalScroll();

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

  const areTrafficLightsVisible =
    IS_ELECTRON && IS_MAC && !uiStore.isFullScreen;

  const previous = useCallback(() => mainStore.projects.selectOffset(-1), []);
  const next = useCallback(() => mainStore.projects.selectOffset(1), []);
  const newProject = useCallback(() => mainStore.projects.create(), []);
  const close = useCallback(() => mainStore.project?.close(), []);
  const forceClose = useCallback(() => mainStore.project?.close(true), []);

  useHotkey('projects_next', next);
  useHotkey('projects_previous', previous);
  useHotkey('projects_new', newProject);
  useHotkey('projects_close', close);
  useHotkey('projects_forceClose', forceClose);

  return (
    <div
      className={clsx(styles.tabs, { [styles.mac]: areTrafficLightsVisible })}
    >
      {!(IS_ELECTRON && IS_MAC) && <Logo />}
      <ViewTab viewId="home">
        <BsHouseFill />
      </ViewTab>
      <ViewTab
        viewId="settings"
        marquee={!!mainStore.tasks.queues.settings.length}
      >
        <BsGearFill />
      </ViewTab>
      <ViewTab
        viewId="models"
        badge={remaining.length}
        value={downloadValue}
        max={downloadMax}
      >
        <BsBoxFill />
      </ViewTab>
      <div
        ref={ref => drop(horizontalScroll(ref))}
        className={styles.projectTabs}
      >
        {mainStore.projects.projects.map(project => (
          <ProjectTab key={project.id} project={project} />
        ))}
      </div>
      <BaseTab
        onClick={newProject}
        menu={
          <>
            <ContextMenuItem
              onSelect={() => {
                mainStore.projects.create(undefined, ProjectType.SIMPLE);
              }}
            >
              New simple project
            </ContextMenuItem>
            {IS_DEV && (
              <ContextMenuItem
                onSelect={() => {
                  mainStore.projects.create(undefined, ProjectType.TRAINING);
                }}
              >
                New training project
              </ContextMenuItem>
            )}
          </>
        }
      >
        <BsPlusLg />
      </BaseTab>
      <Controls />
    </div>
  );
});
