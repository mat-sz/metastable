import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { VarButton, VarCategory, VarToggle } from 'react-var-ui';

import { VarModel } from '$components/varModel';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';

export const Upscale: React.FC = observer(() => {
  const project = useSimpleProject();
  const defaultModel = mainStore.defaultModelName(ModelType.UPSCALE_MODEL);

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
          buttonLabel="Model manager"
          onClick={() => mainStore.openModelManager()}
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
