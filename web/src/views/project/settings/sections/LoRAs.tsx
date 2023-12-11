import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarSelect,
  VarSlider,
} from 'react-var-ui';
import { BsX } from 'react-icons/bs';

import { mainStore } from '../../../../stores/MainStore';
import { IconButton } from '../../../../components/IconButton';

export const LoRAs: React.FC = observer(() => {
  const project = mainStore.project!;

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
            <VarSelect
              label="Model"
              path="name"
              options={mainStore.info.models.loras?.map(
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
          </VarCategory>
        )}
      </VarArray>
      <VarButton
        buttonLabel="Add LoRA"
        onClick={() => {
          project.addLora(mainStore.info.models.loras?.[0].name);
        }}
      />
    </>
  );
});
