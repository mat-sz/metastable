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
  VarModel,
  VarSelect,
  VarSlider,
  VarToggle,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';

export const IPAdapters: React.FC = observer(() => {
  const project = useSimpleProject();
  const defaultModel = mainStore.defaultModelName(ModelType.IPADAPTER);

  return (
    <>
      <VarArray path="models.ipadapters">
        {(_, i) => (
          <VarCategory
            label={
              <>
                <span>IPAdapter</span>
                <IconButton
                  title="Delete"
                  onClick={() => {
                    project.removeIPAdapter(i);
                  }}
                >
                  <BsX />
                </IconButton>
              </>
            }
          >
            <VarToggle label="Enable" path="enabled" />
            <VarModel path="name" modelType={ModelType.IPADAPTER} />
            <VarModel
              path="clip_vision_name"
              modelType={ModelType.CLIP_VISION}
            />
            <VarSlider
              label="Weight"
              path="weight"
              min={0}
              max={1}
              step={0.01}
              defaultValue={1}
              showInput
            />
            <VarImage label="Image" path="image" />
            <VarSelect
              label="Image mode"
              path="image_mode"
              options={[
                { key: 'stretch', label: 'Stretch' },
                { key: 'center', label: 'Center' },
                { key: 'cover', label: 'Cover' },
                { key: 'contain', label: 'Contain' },
              ]}
            />
          </VarCategory>
        )}
      </VarArray>
      {defaultModel ? (
        <VarButton
          buttonLabel="Add IPAdapter"
          onClick={() => {
            project.addIPAdapter();
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
