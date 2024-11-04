import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { mainStore } from '$stores/MainStore';

export const ProjectUnsaved: React.FC = observer(() => {
  const { close } = useModal();
  const draftProjects = mainStore.projects.draft;

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
            for (const project of draftProjects) {
              project.close(true);
            }

            await Promise.all(draftProjects.map(project => project.delete()));
            close();
            mainStore.exit(true);
          }}
        >
          Delete
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            for (const project of draftProjects) {
              project.close(true);
            }

            await Promise.all(
              draftProjects.map(project => project.save(undefined, false)),
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
