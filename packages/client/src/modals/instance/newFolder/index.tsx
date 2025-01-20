import React, { useState } from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { VarString } from '$components/var';

interface Props {
  path: string;
  onSave?: (path: string) => void;
}

export const InstanceNewFolder: React.FC<Props> = ({ path, onSave }) => {
  const { close } = useModal();
  const [name, setName] = useState('');

  return (
    <Modal title="New folder" size="small">
      <div>
        <VarString onChange={setName} value={name} label="Name" />
      </div>
      <ModalActions>
        <Button variant="secondary" onClick={() => close()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            const trimmed = name.trim();
            if (!trimmed) {
              return;
            }
            const newPath = await API.instance.createFolder.mutate({
              path,
              name: trimmed,
            });
            onSave?.(newPath);
            close();
          }}
        >
          Save
        </Button>
      </ModalActions>
    </Modal>
  );
};
