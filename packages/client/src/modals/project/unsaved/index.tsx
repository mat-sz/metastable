import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { mainStore } from '$stores/MainStore';
import { filterDraft } from '$utils/project';

export const ProjectUnsaved: React.FC = observer(() => {
  const { projects, onClose } =
    mainStore.projects.unsavedProjectsModalData ?? {};

  if (!projects) {
    return;
  }

  const draftProjects = filterDraft(projects);

  return (
    <Modal
      title="Unsaved projects"
      size="small"
      onSubmit={async (_, action) => {
        if (action === 'delete') {
          await Promise.all(projects.map(project => project.close(true)));
        } else {
          await Promise.all(
            projects.map(project => project.save({ draft: false })),
          );
          for (const project of projects) {
            project.close(true);
          }
        }

        onClose?.();
      }}
    >
      <div>The following projects will be lost after closing:</div>
      <ul>
        {draftProjects.map(project => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
      <div>Would you like to save them?</div>
      <ModalActions>
        <Button variant="danger">Delete</Button>
        <Button variant="primary">Save</Button>
      </ModalActions>
    </Modal>
  );
});
