import { Project } from '@metastable/types';
import React, { useCallback } from 'react';
import { BsCopy, BsPencil, BsTrash, BsXLg } from 'react-icons/bs';

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
        icon={<BsCopy />}
      >
        Duplicate
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={async () => {
          modalStore.show(<ProjectRename project={await getProjectObj()} />);
        }}
        icon={<BsPencil />}
      >
        Rename
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={async () => {
          modalStore.show(<ProjectDelete project={await getProjectObj()} />);
        }}
        icon={<BsTrash />}
      >
        Delete
      </ContextMenuItem>
      {isTab && !!project && (
        <>
          <ContextMenuDivider />
          <ContextMenuItem onSelect={() => project.close()} icon={<BsXLg />}>
            Close
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => project.closeOther()}
            icon={<BsXLg />}
          >
            Close other tabs
          </ContextMenuItem>
        </>
      )}
    </>
  );
};
