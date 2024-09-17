import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarModel,
  VarSlider,
  VarToggle,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';

export const LoRAs: React.FC = observer(() => {
  const project = useSimpleProject();
  const type = ModelType.LORA;
  const defaultModel = mainStore.defaultModelName(type);

  return (
    <>
      <VarArray path="models.lora">
        {(_, i) => (
          <VarCategory
            label={
              <>
                <span>LoRA</span>
                <IconButton
                  title="Delete"
                  onClick={() => {
                    project.removeModel(type, i);
                  }}
                >
                  <BsX />
                </IconButton>
              </>
            }
          >
            <VarToggle label="Enable" path="enabled" />
            <VarModel
              path="name"
              modelType={type}
              checkpointType={project.checkpointType}
            />
            <VarSlider
              label="Strength"
              path="strength"
              min={-5}
              max={5}
              step={0.01}
              defaultValue={1}
              showInput
            />
          </VarCategory>
        )}
      </VarArray>
      {defaultModel ? (
        <VarButton
          buttonLabel="Add LoRA"
          onClick={() => {
            project.addModel(type, defaultModel);
          }}
        />
      ) : (
        <VarButton
          buttonLabel="Model manager"
          onClick={() => mainStore.openModelManager()}
        />
      )}
    </>
  );
});
