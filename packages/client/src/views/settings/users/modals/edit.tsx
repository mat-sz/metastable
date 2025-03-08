import React, { useState } from 'react';

import { TRPC } from '$api';
import { Alert } from '$components/alert';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { VarString, VarUI } from '$components/var';
import { useModalContext } from '$hooks/useModal';

interface Props {
  username: string;
  onDone?: () => void;
}

export const UserEdit: React.FC<Props> = ({ username, onDone }) => {
  const { close } = useModalContext();
  const [data, setData] = useState<{ password: string }>({
    password: '',
  });

  const mutation = TRPC.auth.user.update.useMutation();

  return (
    <Modal title="Edit user" size="small">
      <div>
        {!!mutation.error && (
          <Alert variant="error">{mutation.error.message}</Alert>
        )}
        <VarUI onChange={setData} values={data!}>
          <VarString value={username} readOnly label="Username" />
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
            await mutation.mutateAsync({ username, ...data });
            onDone?.();
            close();
          }}
        >
          Update
        </Button>
      </ModalActions>
    </Modal>
  );
};
