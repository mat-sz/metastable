import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarImage,
  VarSelect,
  VarSlider,
} from 'react-var-ui';
import { BsX } from 'react-icons/bs';

import { mainStore } from '../../../../stores/MainStore';
import { IconButton } from '../../../../components/IconButton';

export const Controlnets: React.FC = observer(() => {
  const project = mainStore.project!;
  const controlnets = mainStore.info.models.controlnet;

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
            <VarSelect
              label="Model"
              path="name"
              options={controlnets?.map(
                ({ name }) =>
                  ({
                    key: name,
                    label: name,
                  }) || [],
              )}
            />
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
      {controlnets?.[0] ? (
        <VarButton
          buttonLabel="Add Controlnet"
          onClick={() => {
            project.addControlnet(controlnets?.[0].name);
          }}
        />
      ) : (
        <VarButton
          buttonLabel="Download manager"
          onClick={() => {
            mainStore.downloads.open();
          }}
        />
      )}
    </>
  );
});
