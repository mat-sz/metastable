import { Metamodel, ModelType } from '@metastable/types';
import React, { useState } from 'react';
import { BsX } from 'react-icons/bs';

import { API } from '$api';
import { Button } from '$components/button';
import { IconButton } from '$components/iconButton';
import { Modal, ModalActions } from '$components/modal';
import {
  VarAddModel,
  VarArray,
  VarLabelActions,
  VarModel,
  VarString,
  VarUI,
} from '$components/var';

interface Props {
  models?: Metamodel['models'];
  onSave?: (mrn: string) => void;
}

export const ModelCreateMetamodel: React.FC<Props> = ({
  models = {},
  onSave,
}) => {
  const [data, setData] = useState<{
    name: string;
    models: Metamodel['models'];
  }>({ name: '', models });

  return (
    <Modal
      title="Create metamodel"
      size="small"
      onSubmit={async () => {
        data.name = data.name.trim();
        if (!data.name) {
          return;
        }

        const modelMrn = await API.model.createMetamodel.mutate({
          ...data,
          type: ModelType.CHECKPOINT,
        });

        if (modelMrn) {
          onSave?.(modelMrn);
        }
      }}
    >
      <div>
        <VarUI onChange={setData} values={data}>
          <VarString path="name" label="Filename" />
          <VarModel
            path="models.checkpoint"
            modelType={ModelType.CHECKPOINT}
            label="Checkpoint"
          />
          <VarModel
            path="models.diffusionModel"
            modelType={ModelType.DIFFUSION_MODEL}
            label="Diffusion model"
          />
          <VarModel path="models.vae" modelType={ModelType.VAE} label="VAE" />
          <VarArray
            path="models.textEncoders"
            footer={({ append }) => (
              <VarAddModel
                label="Text encoder"
                modelType={ModelType.TEXT_ENCODER}
                onSelect={model => {
                  append(model.mrn);
                }}
              />
            )}
          >
            {({ remove }) => (
              <VarModel
                path=""
                modelType={ModelType.TEXT_ENCODER}
                label={
                  <VarLabelActions
                    label="Text encoder"
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
        <Button variant="primary">Create</Button>
      </ModalActions>
    </Modal>
  );
};
