import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectDelete: React.FC<Props> = ({ project }) => {
  const { close } = useModal();

  return (
    <Modal title="Delete project" size="small">
      <div>
        Are you sure you want to delete project <span>{project.name}</span>?
      </div>
      <ModalActions>
        <Button
          variant="secondary"
          onClick={() => {
            close();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            project.delete();
            close();
          }}
        >
          Confirm
        </Button>
      </ModalActions>
    </Modal>
  );
};
