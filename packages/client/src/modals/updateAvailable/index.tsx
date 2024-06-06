import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';

interface Props {
  version: string;
}

export const UpdateAvailable: React.FC<Props> = ({ version }) => {
  const { close } = useModal();

  return (
    <Modal title="Update available" size="small">
      <div>
        New version of {__APP_NAME__} is available: {version}
      </div>
      <div>Would you like to install and restart?</div>
      <ModalActions>
        <Button variant="secondary" onClick={() => close()}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            API.electron.autoUpdater.install.mutate();
          }}
        >
          Restart
        </Button>
      </ModalActions>
    </Modal>
  );
};
