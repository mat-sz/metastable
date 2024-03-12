import React from 'react';
import { Model, ModelType } from '@metastable/types';

import { Modal, useModal } from '$components/modal';
import { ModelBrowser } from '../../components/modelBrowser';

interface Props {
  type: ModelType;
  onSelect: (model: Model) => void;
}

export const ModelSelect: React.FC<Props> = ({ type, onSelect }) => {
  const { close } = useModal();

  return (
    <Modal title="Select model">
      <ModelBrowser
        type={type}
        onSelect={model => {
          onSelect(model);
          close();
        }}
      />
    </Modal>
  );
};
