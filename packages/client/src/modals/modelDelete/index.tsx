import React from 'react';
import { ModelType } from '@metastable/types';

import { Modal, ModalActions, useModal } from '$components/modal';
import { TRPC } from '$api';
import { Button } from '$components/button';

interface Props {
  type: ModelType;
  name: string;
}

export const ModelDelete: React.FC<Props> = ({ type, name }) => {
  const { close } = useModal();

  const deleteMutation = TRPC.model.delete.useMutation();

  return (
    <Modal title="Delete model" size="small">
      <div>
        Are you sure you want to delete <span>{name}</span>?
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
            deleteMutation.mutate({ name, type });
            close();
          }}
        >
          Confirm
        </Button>
      </ModalActions>
    </Modal>
  );
};
