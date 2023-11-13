import React, { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useDrag, useDrop } from 'react-dnd';
import styles from './Projects.module.scss';
import { Project } from '../../stores/project';
import { mainStore } from '../../stores/MainStore';
import clsx from 'clsx';
import { TabProps, TAB_ITEM } from './Projects';

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
      {project.id}
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
