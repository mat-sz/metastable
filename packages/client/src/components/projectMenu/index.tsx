import { Project as APIProject } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import {
  BsCopy,
  BsPencil,
  BsPlusLg,
  BsTag,
  BsTrash,
  BsXLg,
} from 'react-icons/bs';

import {
  ContextMenuCheckbox,
  ContextMenuDivider,
  ContextMenuInput,
  ContextMenuItem,
  ContextMenuSubmenu,
} from '$components/contextMenu';
import { Tag } from '$components/tag';
import { TagIcon } from '$components/tagIcon';
import { ProjectDelete } from '$modals/project/delete';
import { ProjectDuplicate } from '$modals/project/duplicate';
import { ProjectRename } from '$modals/project/rename';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';

export interface ProjectMenuProps {
  projectId: APIProject['id'];
  isTab?: boolean;
}

export const ProjectMenu: React.FC<ProjectMenuProps> = observer(
  ({ projectId, isTab }) => {
    const getProjectObj = useCallback(
      () => mainStore.projects.get(projectId),
      [projectId],
    );

    const allTags = mainStore.projects.tags;
    const data = mainStore.projects.all.find(
      project => project.id === projectId,
    );

    if (!data) {
      return null;
    }

    const tags = data.tags ?? [];

    return (
      <>
        <ContextMenuItem
          onSelect={async () => {
            modalStore.show(
              <ProjectDuplicate project={await getProjectObj()} />,
            );
          }}
          icon={<BsCopy />}
        >
          Duplicate project
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={async () => {
            modalStore.show(<ProjectRename project={await getProjectObj()} />);
          }}
          icon={<BsPencil />}
        >
          Rename project
        </ContextMenuItem>
        <ContextMenuSubmenu
          icon={<BsTag />}
          items={
            <>
              <ContextMenuInput
                onSubmit={tag => {
                  mainStore.projects.addTag(data.id, tag.trim());
                }}
                placeholder="Add new tag"
                buttonIcon={<BsPlusLg />}
              />
              {!!allTags.length && <ContextMenuDivider />}
              {allTags.map(tag => (
                <ContextMenuCheckbox
                  key={tag}
                  value={tags.includes(tag)}
                  onChange={value => {
                    if (value) {
                      mainStore.projects.addTag(data.id, tag);
                    } else {
                      mainStore.projects.removeTag(data.id, tag);
                    }
                  }}
                >
                  <Tag icon={<TagIcon tag={tag} />}>{tag}</Tag>
                </ContextMenuCheckbox>
              ))}
            </>
          }
        >
          Tag project
        </ContextMenuSubmenu>
        <ContextMenuDivider />
        <ContextMenuItem
          onSelect={async () => {
            modalStore.show(<ProjectDelete project={await getProjectObj()} />);
          }}
          icon={<BsTrash />}
          variant="danger"
        >
          Delete project
        </ContextMenuItem>
        {isTab && (
          <>
            <ContextMenuDivider />
            <ContextMenuItem
              onSelect={async () => {
                const project = await getProjectObj();
                project.close();
              }}
              icon={<BsXLg />}
            >
              Close project
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={async () => {
                const project = await getProjectObj();
                project.closeOther();
              }}
              icon={<BsXLg />}
            >
              Close other projects
            </ContextMenuItem>
          </>
        )}
      </>
    );
  },
);
