import React, { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useDrag, useDrop } from 'react-dnd';
import clsx from 'clsx';
import { BsGearFill, BsHouseFill, BsX } from 'react-icons/bs';
import { runInAction } from 'mobx';

import { mainStore } from '$stores/MainStore';
import type { BaseProject } from '$stores/project';
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

    return (
      <div
        ref={ref}
        className={clsx(styles.tab, {
          [styles.selected]:
            mainStore.view === 'project' &&
            mainStore.projects.currentId === project.id,
        })}
        onClick={() => mainStore.projects.select(project.id)}
        style={{
          opacity: isDragging ? 0.5 : 1,
        }}
      >
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

export const ViewTab: React.FC<React.PropsWithChildren<{ viewId: string }>> =
  observer(({ viewId, children }) => {
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

  return (
    <div ref={drop} className={styles.tabs}>
      <div className={styles.logo}>Metastable</div>
      <ViewTab viewId="home">
        <BsHouseFill />
      </ViewTab>
      <ViewTab viewId="settings">
        <BsGearFill />
      </ViewTab>
      {mainStore.projects.projects.map(project => (
        <ProjectTab key={project.id} project={project} />
      ))}
    </div>
  );
});
