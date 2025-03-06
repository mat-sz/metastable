import { Project } from '@metastable/types';
import React, { useCallback } from 'react';

import { ContextMenuDivider, ContextMenuItem } from '$components/contextMenu';
import { ProjectDelete } from '$modals/project/delete';
import { ProjectDuplicate } from '$modals/project/duplicate';
import { ProjectRename } from '$modals/project/rename';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { BaseProject } from '$stores/project';

export interface ProjectMenuProps {
  projectData?: Project;
  project?: BaseProject;
  isTab?: boolean;
}

export const ProjectMenu: React.FC<ProjectMenuProps> = ({
  projectData,
  project,
  isTab,
}) => {
  const getProjectObj = useCallback(
    () => project ?? mainStore.projects.get(projectData!.id),
    [project, projectData],
  );

  if (!project && !projectData) {
    return null;
  }

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
      {isTab && !!project && (
        <>
          <ContextMenuDivider />
          <ContextMenuItem onSelect={() => project.close()}>
            Close
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => project.closeOther()}>
            Close other tabs
          </ContextMenuItem>
        </>
      )}
    </>
  );
};
