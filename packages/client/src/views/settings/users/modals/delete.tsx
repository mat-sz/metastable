import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';

interface Props {
  username: string;
  onDone?: () => void;
}

export const UserDelete: React.FC<Props> = ({ username, onDone }) => {
  return (
    <Modal
      title="Confirm user deletion"
      size="small"
      onSubmit={async () => {
        await API.auth.user.delete.mutate(username);
        onDone?.();
      }}
    >
      <div>
        <p>
          Are you sure you want to delete the <strong>{username}</strong> user
          account?
        </p>
      </div>
      <ModalActions>
        <Button variant="danger">Delete</Button>
      </ModalActions>
    </Modal>
  );
};
