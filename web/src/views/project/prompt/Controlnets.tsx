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
import { mainStore } from '../../../stores/MainStore';

export const Controlnets: React.FC = observer(() => {
  const project = mainStore.project!;

  return (
    <>
      <VarArray path="models.controlnets">
        <VarCategory label="Controlnet">
          <VarSelect
            label="Model"
            path="name"
            options={mainStore.info.models.controlnet?.map(
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
        </VarCategory>
      </VarArray>
      <VarButton
        buttonLabel="Add Controlnet"
        onClick={() => {
          project.addControlnet(mainStore.info.models.controlnet?.[0].name);
        }}
      />
    </>
  );
});
