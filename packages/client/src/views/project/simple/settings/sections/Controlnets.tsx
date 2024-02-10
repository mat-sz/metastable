import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarImage,
  VarSelect,
  VarSlider,
  VarToggle,
} from 'react-var-ui';
import { BsX } from 'react-icons/bs';
import { ModelType } from '@metastable/types';

import { IconButton } from '@components/iconButton';
import { useUI } from '@components/ui';
import { ModelManager } from '@modals/models';
import { mainStore } from '@stores/MainStore';
import { VarModel } from '../components/VarModel';
import { useSimpleProject } from '../../../context';

export const Controlnets: React.FC = observer(() => {
  const project = useSimpleProject();
  const defaultModel = mainStore.defaultModelName(ModelType.CONTROLNET);
  const { showModal } = useUI();

  return (
    <>
      <VarArray path="models.controlnets">
        {(_, i) => (
          <VarCategory
            label={
              <>
                <span>Controlnet</span>
                <IconButton
                  title="Delete"
                  onClick={() => {
                    project.removeControlnet(i);
                  }}
                >
                  <BsX />
                </IconButton>
              </>
            }
          >
            <VarToggle label="Enable" path="enabled" />
            <VarModel path="name" modelType={ModelType.CONTROLNET} />
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
          buttonLabel="Add Controlnet"
          onClick={() => {
            project.addControlnet(defaultModel);
          }}
        />
      ) : (
        <VarButton
          buttonLabel="Download manager"
          onClick={() => showModal(<ModelManager defaultTab="recommended" />)}
        />
      )}
    </>
  );
});
