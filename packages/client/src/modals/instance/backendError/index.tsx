import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Log } from '$components/log';
import { Modal, ModalActions } from '$components/modal';
import { mainStore } from '$stores/MainStore';

export const InstanceBackendError: React.FC = () => {
  return (
    <Modal
      title="Backend error"
      size="small"
      onSubmit={() => API.instance.restart.mutate()}
    >
      <div>Unable to start backend. Details:</div>
      <Log items={mainStore.backendLog} />
      <ModalActions cancelText="Close">
        <Button variant="primary">Restart</Button>
      </ModalActions>
    </Modal>
  );
};
