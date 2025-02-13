import React from 'react';

import { TRPC } from '$api';
import { Alert } from '$components/alert';
import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';

interface Props {
  username: string;
  onDone?: () => void;
}

export const UserDelete: React.FC<Props> = ({ username, onDone }) => {
  const { close } = useModal();

  const mutation = TRPC.auth.user.delete.useMutation();

  return (
    <Modal title="Confirm user deletion" size="small">
      <div>
        {!!mutation.error && (
          <Alert variant="error">{mutation.error.message}</Alert>
        )}
        <p>
          Are you sure you want to delete the <strong>{username}</strong> user
          account?
        </p>
      </div>
      <ModalActions>
        <Button
          variant="secondary"
          onClick={() => close()}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={mutation.isPending}
          onClick={async () => {
            await mutation.mutateAsync(username);
            onDone?.();
            close();
          }}
        >
          Delete
        </Button>
      </ModalActions>
    </Modal>
  );
};
