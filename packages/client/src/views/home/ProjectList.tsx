import { Project, ProjectType } from '@metastable/types';
import React from 'react';
import { BsPlus } from 'react-icons/bs';

import { Card, List } from '$components/list';
import { ProjectMenu } from '$components/projectMenu';
import { mainStore } from '$stores/MainStore';

interface Props {
  projects: (Project | 'new')[];
  searchable?: boolean;
  title: string;
}

export const ProjectList: React.FC<Props> = ({
  projects,
  title,
  searchable,
}) => {
  return (
    <List
      header={<h2>{title}</h2>}
      items={projects}
      quickFilter={
        searchable
          ? (data, search) =>
              mainStore.searchFn(data, search, item =>
                typeof item === 'object' ? item.name : '',
              )
          : undefined
      }
    >
      {item =>
        typeof item === 'string' ? (
          <Card
            key={item}
            name="New empty project"
            icon={<BsPlus />}
            onClick={() =>
              mainStore.projects.create(undefined, ProjectType.SIMPLE, true)
            }
          />
        ) : (
          <Card
            name={item.name}
            key={item.id}
            imageUrl={item.lastOutput?.image.thumbnailUrl}
            onClick={() => {
              mainStore.projects.open(item.id);
            }}
            onMiddleClick={() => {
              mainStore.projects.open(item.id, false);
            }}
            menu={<ProjectMenu project={item} />}
          />
        )
      }
    </List>
  );
};
