import React from 'react';
import { Model } from '@metastable/types';

import { Modal } from '../../components';
import { useModal } from '../../contexts/modal';
import { ModelBrowser } from '../../components/modelBrowser';

interface Props {
  type: string;
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
