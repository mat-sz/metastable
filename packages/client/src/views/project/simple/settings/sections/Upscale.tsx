import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { VarButton, VarCategory, VarModel, VarToggle } from '$components/var';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';

export const Upscale: React.FC = observer(() => {
  const project = useSimpleProject();
  const defaultModel = mainStore.defaultModelName(ModelType.UPSCALE_MODEL);

  return (
    <VarCategory label="Upscale">
      {defaultModel ? (
        <VarToggle
          label="Enable"
          path="upscale.enabled"
          onChange={value => {
            if (value && !project.settings.upscale?.name) {
              project.settings.upscale = {
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
      {project.settings.upscale?.enabled && (
        <VarModel path="upscale.name" modelType={ModelType.UPSCALE_MODEL} />
      )}
    </VarCategory>
  );
});
