import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';

interface Props {
  count: number;
  onDelete: () => Promise<void> | void;
}

export const ProjectDeleteFile: React.FC<Props> = ({ count, onDelete }) => {
  return (
    <Modal title="Delete files" size="small" onSubmit={onDelete}>
      <div>
        Are you sure you want to delete{' '}
        <span>
          {count} {count === 1 ? 'file' : 'files'}
        </span>
        ?
      </div>
      <ModalActions>
        <Button variant="danger">Delete</Button>
      </ModalActions>
    </Modal>
  );
};
