import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarButton, VarCategory, VarToggle } from 'react-var-ui';
import { ModelType } from '@metastable/types';

import { mainStore } from '../../../../stores/MainStore';
import { useUI } from '../../../../contexts/ui';
import { ModelManager } from '../../../../modals/models';
import { VarModel } from '../components/VarModel';

export const Upscale: React.FC = observer(() => {
  const project = mainStore.project!;
  const defaultModel = mainStore.defaultModelName(ModelType.UPSCALE_MODEL);
  const { showModal } = useUI();

  const enabled = !!project.settings.models.upscale?.name;

  return (
    <VarCategory label="Upscale">
      {defaultModel ? (
        <VarToggle
          label="Enable"
          path="models.upscale.enabled"
          value={enabled}
          onChange={value => {
            if (value && !project.settings.models.upscale?.name) {
              project.settings.models.upscale = {
                enabled: true,
                name: defaultModel,
              };
            }
          }}
        />
      ) : (
        <VarButton
          buttonLabel="Download manager"
          onClick={() => showModal(<ModelManager defaultTab="recommended" />)}
        />
      )}
      {enabled && (
        <VarModel
          path="models.upscale.name"
          modelType={ModelType.UPSCALE_MODEL}
        />
      )}
    </VarCategory>
  );
});
