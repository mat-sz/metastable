import { Project } from '@metastable/types';
import React from 'react';
import { BsPlus } from 'react-icons/bs';

import { Card, CardFavorite, List } from '$components/list';
import { ProjectMenu } from '$components/projectMenu';
import { useSearchFn } from '$store/config/hooks';
import { mainStore } from '$stores/MainStore';
import { resolveImage } from '$utils/url';

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
  const searchFn = useSearchFn();

  return (
    <List
      header={<h2>{title}</h2>}
      items={projects}
      quickFilter={
        searchable
          ? (data, search) =>
              searchFn(data, search, item =>
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
            onClick={() => mainStore.projects.create()}
          />
        ) : (
          <Card
            name={item.name}
            key={item.id}
            imageUrl={resolveImage(item.lastOutput?.mrn, 'thumbnail')}
            onClick={() => {
              mainStore.projects.open(item.id);
            }}
            onMiddleClick={() => {
              mainStore.projects.open(item.id, false);
            }}
            menu={<ProjectMenu projectId={item.id} />}
          >
            <CardFavorite
              value={item.favorite}
              onChange={value => {
                mainStore.projects.setFavorite(item.id, value);
              }}
            />
          </Card>
        )
      }
    </List>
  );
};
