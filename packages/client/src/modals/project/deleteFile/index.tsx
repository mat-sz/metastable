import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { useModalContext } from '$hooks/useModal';

interface Props {
  count: number;
  onDelete: () => void;
}

export const ProjectDeleteFile: React.FC<Props> = ({ count, onDelete }) => {
  const { close } = useModalContext();

  return (
    <Modal title="Delete files" size="small">
      <div>
        Are you sure you want to delete{' '}
        <span>
          {count} {count === 1 ? 'file' : 'files'}
        </span>
        ?
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
            onDelete();
            close();
          }}
        >
          Delete
        </Button>
      </ModalActions>
    </Modal>
  );
};
