import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { mainStore } from '$stores/MainStore';

export const BundleReset: React.FC = () => {
  const { close } = useModal();

  return (
    <Modal title="Reset settings and Python dependencies" size="small">
      <div>
        Are you sure you want to reset settings and Python dependencies?{' '}
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
            mainStore.resetBundle();
            close();
          }}
        >
          Confirm
        </Button>
      </ModalActions>
    </Modal>
  );
};
