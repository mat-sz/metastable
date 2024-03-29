import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarSlider,
  VarToggle,
} from 'react-var-ui';
import { BsX } from 'react-icons/bs';
import { ModelType } from '@metastable/types';

import { IconButton } from '$components/iconButton';
import { VarModel } from '$components/varModel';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';

export const LoRAs: React.FC = observer(() => {
  const project = useSimpleProject();
  const defaultModel = mainStore.defaultModelName(ModelType.LORA);

  return (
    <>
      <VarArray path="models.loras">
        {(_, i) => (
          <VarCategory
            label={
              <>
                <span>LoRA</span>
                <IconButton
                  title="Delete"
                  onClick={() => {
                    project.removeLora(i);
                  }}
                >
                  <BsX />
                </IconButton>
              </>
            }
          >
            <VarToggle label="Enable" path="enabled" />
            <VarModel path="name" modelType={ModelType.LORA} />
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
            project.addLora(defaultModel);
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
