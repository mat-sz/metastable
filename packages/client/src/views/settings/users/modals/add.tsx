import React, { useState } from 'react';

import { TRPC } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { VarString, VarUI } from '$components/var';

interface Props {
  onDone?: () => void;
}

export const UserAdd: React.FC<Props> = ({ onDone }) => {
  const [data, setData] = useState<{ username: string; password: string }>({
    username: '',
    password: '',
  });

  const mutation = TRPC.auth.user.create.useMutation();

  return (
    <Modal
      title="Add user"
      size="small"
      onSubmit={async () => {
        await mutation.mutateAsync(data);
        onDone?.();
      }}
    >
      <div>
        <VarUI onChange={setData} values={data!}>
          <VarString path="username" label="Username" />
          <VarString path="password" type="password" label="Password" />
        </VarUI>
      </div>
      <ModalActions>
        <Button variant="primary" disabled={mutation.isPending}>
          Save
        </Button>
      </ModalActions>
    </Modal>
  );
};
