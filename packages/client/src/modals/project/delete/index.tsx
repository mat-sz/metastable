import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectDelete: React.FC<Props> = ({ project }) => {
  return (
    <Modal
      title="Delete project"
      size="small"
      onSubmit={async () => {
        await project.delete();
      }}
    >
      <div>
        Are you sure you want to delete project <span>{project.name}</span>?
      </div>
      <ModalActions>
        <Button variant="danger">Delete</Button>
      </ModalActions>
    </Modal>
  );
};
