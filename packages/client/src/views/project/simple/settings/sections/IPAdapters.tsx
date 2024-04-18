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

export const IPAdapters: React.FC = observer(() => {
  const project = useSimpleProject();
  const type = ModelType.IPADAPTER;
  const defaultModel = mainStore.defaultModelName(type);

  return (
    <>
      <VarArray path="models.ipadapter">
        {(_, i) => (
          <VarCategory
            label={
              <>
                <span>IPAdapter</span>
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
            <VarModel path="clipVisionName" modelType={ModelType.CLIP_VISION} />
            <VarSlider
              label="Strength"
              path="strength"
              min={0}
              max={1}
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
          buttonLabel="Add IPAdapter"
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
