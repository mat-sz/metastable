import React from 'react';
import { ModelType } from '@metastable/types';

import { Modal, useModal } from '$components/modal';
import { TRPC } from '$api';

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
      <button
        onClick={() => {
          close();
        }}
      >
        Cancel
      </button>
      <button
        onClick={() => {
          deleteMutation.mutate({ name, type });
          close();
        }}
      >
        Confirm
      </button>
    </Modal>
  );
};
