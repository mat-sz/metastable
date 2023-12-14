import React, { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useDrag, useDrop } from 'react-dnd';
import clsx from 'clsx';
import { BsX } from 'react-icons/bs';

import styles from './Projects.module.scss';
import { Project } from '../../stores/project';
import { mainStore } from '../../stores/MainStore';

const TAB_ITEM = 'project_tab';

interface TabProps {
  project: Project;
}

export const Tab: React.FC<TabProps> = observer(({ project }) => {
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
      drop: (item: Project) => {
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
        [styles.selected]: mainStore.projects.currentId === project.id,
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
});

export const Projects: React.FC = observer(() => {
  const [, drop] = useDrop(
    () => ({
      accept: TAB_ITEM,
      drop: (item: Project, monitor) => {
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
      {mainStore.projects.projects.map(project => (
        <Tab key={project.id} project={project} />
      ))}
    </div>
  );
});
