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

import { mainStore } from '../../../../stores/MainStore';
import { IconButton } from '../../../../components';
import { DownloadManager } from '../../../../modals/download';
import { useUI } from '../../../../contexts/ui';
import { VarModel } from '../components/VarModel';

export const LoRAs: React.FC = observer(() => {
  const { showModal } = useUI();
  const project = mainStore.project!;
  const loras = mainStore.info.models.loras;

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
            <VarModel path="name" modelType="loras" />
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
      {loras?.[0] ? (
        <VarButton
          buttonLabel="Add LoRA"
          onClick={() => {
            project.addLora(mainStore.defaultModelName(ModelType.LORA));
          }}
        />
      ) : (
        <VarButton
          buttonLabel="Download manager"
          onClick={() => showModal(<DownloadManager />)}
        />
      )}
    </>
  );
});
