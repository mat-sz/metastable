import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';

export const InstanceSettingsReset: React.FC = () => {
  const { close } = useModal();

  return (
    <Modal title="Reset all settings" size="small">
      <div>Are you sure you want to reset all settings?</div>
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
            API.instance.resetSettings.mutate();
            close();
          }}
        >
          Confirm
        </Button>
      </ModalActions>
    </Modal>
  );
};
