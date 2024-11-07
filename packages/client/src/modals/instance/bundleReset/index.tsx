import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { setupStore } from '$stores/SetupStore';

interface Props {
  resetAll?: boolean;
}

export const InstanceBundleReset: React.FC<Props> = ({ resetAll }) => {
  const { close } = useModal();

  return (
    <Modal
      title={resetAll ? 'Reset bundle and all settings' : 'Reset bundle'}
      size="small"
    >
      <div>
        {resetAll
          ? 'Are you sure you want to reset all settings and Python dependencies?'
          : 'Are you sure you want to reset Python dependencies?'}
      </div>
      <div>This action might require you to download up to 2GB of data.</div>
      <div>This will not delete your projects or models.</div>
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
            setupStore.resetBundle(resetAll);
            close();
          }}
        >
          Confirm
        </Button>
      </ModalActions>
    </Modal>
  );
};
