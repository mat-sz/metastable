import { Model, ModelType } from '@metastable/types';
import React from 'react';

import { Modal, useModal } from '$components/modal';
import { ModelBrowser } from '../../components/modelBrowser';

interface Props {
  type: ModelType;
  value?: Model;
  onSelect: (model: Model) => void;
}

export const ModelSelect: React.FC<Props> = ({ type, value, onSelect }) => {
  const { close } = useModal();

  return (
    <Modal title="Select model">
      <ModelBrowser
        defaultParts={value?.file.parts}
        type={type}
        onSelect={model => {
          onSelect(model);
          close();
        }}
      />
    </Modal>
  );
};
