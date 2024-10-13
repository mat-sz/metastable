import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { ProjectRename } from '$modals/projectRename';
import { modalStore } from '$stores/ModalStore';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectDraft: React.FC<Props> = observer(({ project }) => {
  const { close } = useModal();

  return (
    <Modal title="Draft project" size="small">
      <div>This project is a draft. Would you like to save it?</div>
      <ModalActions>
        <Button variant="secondary" onClick={() => close()}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            project.delete();
            close();
          }}
        >
          Delete
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            close();
            modalStore.show(
              <ProjectRename project={project} closeAfterRenaming />,
            );
          }}
        >
          Save
        </Button>
      </ModalActions>
    </Modal>
  );
});
