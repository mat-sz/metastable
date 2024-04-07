import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { mainStore } from '$stores/MainStore';

export const UnsavedProjects: React.FC = observer(() => {
  const { close } = useModal();
  const temporaryProjects = mainStore.projects.temporary;

  return (
    <Modal title="Unsaved projects" size="small">
      <div>The following projects will be lost after closing:</div>
      <ul>
        {temporaryProjects.map(project => (
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
            for (const project of temporaryProjects) {
              project.close(true);
            }

            await Promise.all(
              temporaryProjects.map(project => project.delete()),
            );
            close();
            mainStore.exit(true);
          }}
        >
          Delete
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            for (const project of temporaryProjects) {
              project.close(true);
            }

            await Promise.all(
              temporaryProjects.map(project => project.save(undefined, false)),
            );
            close();
            mainStore.exit(true);
          }}
        >
          Save
        </Button>
      </ModalActions>
    </Modal>
  );
});
