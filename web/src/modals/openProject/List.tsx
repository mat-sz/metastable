import React from 'react';
import { MdNoPhotography } from 'react-icons/md';

import styles from './List.module.scss';
import { APIProject } from '../../types/project';
import { mainStore } from '../../stores/MainStore';

interface ItemProps {
  project: APIProject;
}

export const Item: React.FC<ItemProps> = ({ project }) => {
  const imageUrl = project.lastOutput
    ? mainStore.view(project.id, 'output', project.lastOutput)
    : undefined;

  return (
    <div
      key={project.id}
      className={styles.project}
      onClick={() => {
        // TODO: Close modal.
        mainStore.projects.open(project.id);
      }}
    >
      <div className={styles.preview}>
        {imageUrl ? (
          <img
            crossOrigin="anonymous"
            className={styles.background}
            src={imageUrl}
          />
        ) : (
          <div className={styles.noPhotos}>
            <MdNoPhotography />
          </div>
        )}
        <div className={styles.details}>
          <div className={styles.name}>{project.name}</div>
        </div>
      </div>
    </div>
  );
};

interface ListProps {
  data: APIProject[];
}

export const List: React.FC<ListProps> = ({ data }) => {
  if (!data.length) {
    return (
      <div className={styles.list}>
        <span className={styles.empty}>No recent projects...</span>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {data.map(project => (
        <Item key={project.id} project={project} />
      ))}
    </div>
  );
};
