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

import { mainStore } from '../../../../stores/MainStore';
import { IconButton } from '../../../../components';
import { useUI } from '../../../../contexts/ui';
import { ModelManager } from '../../../../modals/models';
import { VarModel } from '../components/VarModel';

export const IPAdapters: React.FC = observer(() => {
  const project = mainStore.project!;
  const ipadapters = mainStore.info.models.ipadapters;
  const { showModal } = useUI();

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
            <VarModel path="name" modelType="ipadapters" />
            <VarModel path="clip_vision_name" modelType="clip_vision" />
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
      {ipadapters?.[0] ? (
        <VarButton
          buttonLabel="Add IPAdapter"
          onClick={() => {
            project.addIPAdapter();
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
