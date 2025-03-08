import React from 'react';

import { TRPC } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { useModalContext } from '$hooks/useModal';
import { modelStore } from '$stores/ModelStore';

interface Props {
  mrn: string;
}

export const ModelDelete: React.FC<Props> = ({ mrn }) => {
  const { close } = useModalContext();

  const deleteMutation = TRPC.model.delete.useMutation();
  const model = modelStore.find(mrn);

  return (
    <Modal title="Delete model" size="small">
      <div>
        Are you sure you want to delete <span>{model?.name}</span>?
      </div>
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
            deleteMutation.mutate({ mrn });
            close();
          }}
        >
          Confirm
        </Button>
      </ModalActions>
    </Modal>
  );
};
