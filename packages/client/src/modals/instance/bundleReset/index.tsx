import React from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { setupStore } from '$stores/SetupStore';

interface Props {
  resetAll?: boolean;
}

export const InstanceBundleReset: React.FC<Props> = ({ resetAll }) => {
  return (
    <Modal
      title={resetAll ? 'Reset bundle and all settings' : 'Reset bundle'}
      size="small"
      onSubmit={() => setupStore.resetBundle(resetAll)}
    >
      <div>
        {resetAll
          ? 'Are you sure you want to reset all settings and Python dependencies?'
          : 'Are you sure you want to reset Python dependencies?'}
      </div>
      <div>This action might require you to download up to 2GB of data.</div>
      <div>This will not delete your projects or models.</div>
      <ModalActions>
        <Button variant="danger">Confirm</Button>
      </ModalActions>
    </Modal>
  );
};
