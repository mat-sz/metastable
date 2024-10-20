import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Log } from '$components/log';
import { Modal, ModalActions, useModal } from '$components/modal';
import { mainStore } from '$stores/MainStore';

export const BackendError: React.FC = () => {
  const { close } = useModal();

  return (
    <Modal title="Backend error" size="small">
      <div>Unable to start backend. Details:</div>
      <Log items={mainStore.backendLog} />
      <ModalActions>
        <Button
          variant="secondary"
          onClick={() => {
            close();
          }}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            API.instance.restart.mutate();
            close();
          }}
        >
          Restart
        </Button>
      </ModalActions>
    </Modal>
  );
};
