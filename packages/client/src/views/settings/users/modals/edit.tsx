import React, { useState } from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { VarString, VarUI } from '$components/var';

interface Props {
  username: string;
  onDone?: () => void;
}

export const UserEdit: React.FC<Props> = ({ username, onDone }) => {
  const [data, setData] = useState<{ password: string }>({
    password: '',
  });

  return (
    <Modal
      title="Edit user"
      size="small"
      onSubmit={async () => {
        await API.auth.user.update.mutate({ username, ...data });
        onDone?.();
        close();
      }}
    >
      <div>
        <VarUI onChange={setData} values={data!}>
          <VarString value={username} readOnly label="Username" />
          <VarString path="password" type="password" label="Password" />
        </VarUI>
      </div>
      <ModalActions>
        <Button variant="primary">Update</Button>
      </ModalActions>
    </Modal>
  );
};
