import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { useModal, useModalContext } from '$hooks/useModal';
import { ProjectRename } from '$modals/project/rename';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectDraft: React.FC<Props> = observer(({ project }) => {
  const { close } = useModalContext();
  const { show } = useModal(
    <ProjectRename project={project} closeAfterRenaming />,
  );

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
            show();
          }}
        >
          Save
        </Button>
      </ModalActions>
    </Modal>
  );
});
