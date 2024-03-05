import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarButton, VarCategory, VarToggle } from 'react-var-ui';
import { ModelType } from '@metastable/types';

import { useUI } from '$components/ui';
import { ModelManager } from '$modals/models';
import { mainStore } from '$stores/MainStore';
import { VarModel } from '../components/VarModel';
import { useSimpleProject } from '../../../context';

export const Upscale: React.FC = observer(() => {
  const project = useSimpleProject();
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
