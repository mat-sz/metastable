import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarImage,
  VarImageMode,
  VarModel,
  VarSlider,
  VarToggle,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';

export const Controlnets: React.FC = observer(() => {
  const project = useSimpleProject();
  const type = ModelType.CONTROLNET;
  const defaultModel = mainStore.defaultModelName(type);

  return (
    <>
      <VarArray path="models.controlnet">
        {(_, i) => (
          <VarCategory
            label={
              <>
                <span>Controlnet</span>
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
            <VarModel path="name" modelType={type} />
            <VarSlider
              label="Strength"
              path="strength"
              min={0}
              max={2}
              step={0.01}
              defaultValue={1}
              showInput
            />
            <VarImage label="Image" path="image" />
            <VarImageMode label="Image mode" path="imageMode" />
          </VarCategory>
        )}
      </VarArray>
      {defaultModel ? (
        <VarButton
          buttonLabel="Add Controlnet"
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
