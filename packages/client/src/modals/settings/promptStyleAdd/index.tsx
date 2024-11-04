import { Architecture, PromptStyle } from '@metastable/types';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { VarCategory, VarSelect, VarString, VarUI } from '$components/var';

interface Props {
  onAdd: (style: PromptStyle) => void;
}

const MAPPED_ARCHITECTURES = Object.entries(Architecture).map(
  ([label, value]) => ({ key: value, label, value }),
);

export const SettingsPromptStyleAdd: React.FC<Props> = ({ onAdd }) => {
  const [style, setStyle] = useState<Omit<PromptStyle, 'id'>>({
    name: '',
    architecture: 'any',
  });
  const { close } = useModal();

  return (
    <Modal title="Add prompt style" size="small">
      <VarUI values={style} onChange={setStyle}>
        <VarCategory label="Style" forceBorder>
          <VarString path="name" label="Name" />
          <VarSelect
            path="architecture"
            label="Model architecture"
            options={[
              {
                key: 'any',
                label: 'Any',
                value: 'any',
              },
              ...MAPPED_ARCHITECTURES,
            ]}
          />
          <VarString path="positive" label="Positive prompt" multiline />
          <VarString path="negative" label="Negative prompt" multiline />
        </VarCategory>
        <div>
          <strong>Hint:</strong> Use {'{prompt}'} if you'd like for the input
          prompt to be placed inside of the style prompt.
        </div>
      </VarUI>
      <ModalActions>
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onAdd({ ...style, id: nanoid() });
            close();
          }}
        >
          Add
        </Button>
      </ModalActions>
    </Modal>
  );
};
