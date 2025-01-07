import { Metamodel, ModelType } from '@metastable/types';
import React, { useState } from 'react';
import { BsX } from 'react-icons/bs';

import { API } from '$api';
import { Button } from '$components/button';
import { IconButton } from '$components/iconButton';
import { Modal, ModalActions, useModal } from '$components/modal';
import {
  VarAddModel,
  VarArray,
  VarLabelActions,
  VarModel,
  VarString,
  VarUI,
} from '$components/var';

interface Props {
  refData?: Metamodel['ref'];
  onSave?: (mrn: string) => void;
}

export const ModelCreateMetamodel: React.FC<Props> = ({
  refData = {},
  onSave,
}) => {
  const { close } = useModal();
  const [data, setData] = useState<{
    name: string;
    ref: Metamodel['ref'];
  }>({ name: '', ref: refData });

  return (
    <Modal title="Create metamodel" size="small">
      <div>
        <VarUI onChange={setData} values={data}>
          <VarString path="name" label="Filename" />
          <VarModel
            path="ref.model"
            modelType={ModelType.CHECKPOINT}
            label="Checkpoint"
          />
          <VarModel path="ref.unet" modelType={ModelType.UNET} label="UNET" />
          <VarModel path="ref.vae" modelType={ModelType.VAE} label="VAE" />
          <VarArray
            path="ref.clip"
            footer={({ append }) => (
              <VarAddModel
                label="CLIP"
                modelType={ModelType.CLIP}
                onSelect={model => {
                  append(model.mrn);
                }}
              />
            )}
          >
            {({ remove }) => (
              <VarModel
                path=""
                modelType={ModelType.CLIP}
                label={
                  <VarLabelActions
                    label="CLIP"
                    actions={
                      <IconButton onClick={remove}>
                        <BsX />
                      </IconButton>
                    }
                  />
                }
              />
            )}
          </VarArray>
        </VarUI>
      </div>
      <ModalActions>
        <Button variant="secondary" onClick={() => close()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            if (!data.name) {
              return;
            }

            const modelMrn = await API.model.createMetamodel.mutate({
              ...data,
              type: ModelType.CHECKPOINT,
            });
            close();
            onSave?.(modelMrn);
          }}
        >
          Create
        </Button>
      </ModalActions>
    </Modal>
  );
};
