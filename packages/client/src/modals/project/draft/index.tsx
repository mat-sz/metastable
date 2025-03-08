import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { useModal } from '$hooks/useModal';
import { ProjectRename } from '$modals/project/rename';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectDraft: React.FC<Props> = observer(({ project }) => {
  const { show } = useModal(
    <ProjectRename project={project} closeAfterRenaming />,
  );

  return (
    <Modal
      title="Draft project"
      size="small"
      onSubmit={async (_, action) => {
        if (action === 'delete') {
          await project.delete();
        } else {
          show();
        }
      }}
    >
      <div>This project is a draft. Would you like to save it?</div>
      <ModalActions>
        <Button variant="danger" action="delete">
          Delete
        </Button>
        <Button variant="primary">Save</Button>
      </ModalActions>
    </Modal>
  );
});
