import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';

export const InstanceSettingsReset: React.FC = () => {
  return (
    <Modal
      title="Reset all settings"
      size="small"
      onSubmit={() => API.instance.resetSettings.mutate()}
    >
      <div>Are you sure you want to reset all settings?</div>
      <div>This will not delete your projects or models.</div>
      <ModalActions>
        <Button variant="danger">Confirm</Button>
      </ModalActions>
    </Modal>
  );
};
