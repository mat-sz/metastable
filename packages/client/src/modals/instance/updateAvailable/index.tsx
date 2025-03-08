import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';

interface Props {
  version: string;
}

export const InstanceUpdateAvailable: React.FC<Props> = ({ version }) => {
  return (
    <Modal
      title="Update available"
      size="small"
      onSubmit={() => API.electron.autoUpdater.install.mutate()}
    >
      <div>
        New version of {__APP_NAME__} is available: {version}
      </div>
      <div>Would you like to install and restart?</div>
      <ModalActions cancelText="Close">
        <Button
          variant="secondary"
          href="https://github.com/mat-sz/metastable/blob/main/CHANGELOG.md"
        >
          View changelog
        </Button>
        <Button variant="primary">Restart</Button>
      </ModalActions>
    </Modal>
  );
};
