import React, { useState } from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { VarString } from '$components/var';

interface Props {
  path: string;
  onSave?: (path: string) => void;
}

export const InstanceNewFolder: React.FC<Props> = ({ path, onSave }) => {
  const [name, setName] = useState('');

  return (
    <Modal
      title="New folder"
      size="small"
      onSubmit={async () => {
        const trimmed = name.trim();
        if (!trimmed) {
          return;
        }
        const newPath = await API.instance.createFolder.mutate({
          path,
          name: trimmed,
        });
        onSave?.(newPath);
      }}
    >
      <div>
        <VarString onChange={setName} value={name} label="Name" />
      </div>
      <ModalActions>
        <Button variant="primary">Save</Button>
      </ModalActions>
    </Modal>
  );
};
