import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { BaseProject } from '$stores/project';
import { filterDraft } from '$utils/project';

interface ProjectUnsavedProps {
  projects: BaseProject[];
  onClose?: () => void;
}

export const ProjectUnsaved: React.FC<ProjectUnsavedProps> = observer(
  ({ projects, onClose }) => {
    const { close } = useModal();
    const draftProjects = filterDraft(projects);

    return (
      <Modal title="Unsaved projects" size="small">
        <div>The following projects will be lost after closing:</div>
        <ul>
          {draftProjects.map(project => (
            <li key={project.id}>{project.name}</li>
          ))}
        </ul>
        <div>Would you like to save them?</div>
        <ModalActions>
          <Button variant="secondary" onClick={() => close()}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await Promise.all(projects.map(project => project.close(true)));
              close();
              onClose?.();
            }}
          >
            Delete
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await Promise.all(
                projects.map(project => project.save({ draft: false })),
              );
              for (const project of projects) {
                project.close(true);
              }

              close();
              onClose?.();
            }}
          >
            Save
          </Button>
        </ModalActions>
      </Modal>
    );
  },
);
