import { Project } from '@metastable/types';
import React from 'react';
import { ContextMenuDivider, ContextMenuItem } from 'use-context-menu';

import {
  ProjectDelete,
  ProjectDuplicate,
  ProjectRename,
} from '$modals/project';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';

export interface ProjectMenuProps {
  project: Project;
}

export const ProjectMenu: React.FC<ProjectMenuProps> = ({ project }) => {
  const getProjectObj = () => {
    return mainStore.projects.get(project.id);
  };

  return (
    <>
      <ContextMenuItem
        onSelect={async () => {
          modalStore.show(<ProjectDuplicate project={await getProjectObj()} />);
        }}
      >
        Duplicate
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={async () => {
          modalStore.show(<ProjectRename project={await getProjectObj()} />);
        }}
      >
        Rename
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuItem
        onSelect={async () => {
          modalStore.show(<ProjectDelete project={await getProjectObj()} />);
        }}
      >
        Delete
      </ContextMenuItem>
    </>
  );
};
