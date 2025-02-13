import React, { useState } from 'react';

import { TRPC } from '$api';
import { Alert } from '$components/alert';
import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { VarString, VarUI } from '$components/var';

interface Props {
  onDone?: () => void;
}

export const UserAdd: React.FC<Props> = ({ onDone }) => {
  const { close } = useModal();
  const [data, setData] = useState<{ username: string; password: string }>({
    username: '',
    password: '',
  });

  const mutation = TRPC.auth.user.create.useMutation();

  return (
    <Modal title="Add user" size="small">
      <div>
        {!!mutation.error && (
          <Alert variant="error">{mutation.error.message}</Alert>
        )}
        <VarUI onChange={setData} values={data!}>
          <VarString path="username" label="Username" />
          <VarString path="password" type="password" label="Password" />
        </VarUI>
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
          variant="primary"
          disabled={mutation.isPending}
          onClick={async () => {
            await mutation.mutateAsync(data);
            onDone?.();
            close();
          }}
        >
          Save
        </Button>
      </ModalActions>
    </Modal>
  );
};
