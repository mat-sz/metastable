import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { modelStore } from '$stores/ModelStore';

interface Props {
  mrn: string;
}

export const ModelDelete: React.FC<Props> = ({ mrn }) => {
  const model = modelStore.find(mrn);

  return (
    <Modal
      title="Delete model"
      size="small"
      onSubmit={async () => {
        await API.model.delete.mutate({ mrn });
      }}
    >
      <div>
        Are you sure you want to delete <span>{model?.name}</span>?
      </div>
      <ModalActions>
        <Button variant="danger">Confirm</Button>
      </ModalActions>
    </Modal>
  );
};
