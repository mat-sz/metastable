import { Project } from '@metastable/types';
import React from 'react';
import { ContextMenuItem } from 'use-context-menu';

import { API } from '$api';
import { ProjectDelete } from '$modals/projectDelete';
import { ProjectDuplicate } from '$modals/projectDuplicate';
import { ProjectRename } from '$modals/projectRename';
import { modalStore } from '$stores/ModalStore';
import { createProject } from '$stores/project';

export interface ProjectMenuProps {
  project: Project;
}

export const ProjectMenu: React.FC<ProjectMenuProps> = ({ project }) => {
  const getProjectObj = async () => {
    const projectData = await API.project.get.query({
      projectId: project.id,
    });
    return createProject(projectData, projectData.settings);
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
