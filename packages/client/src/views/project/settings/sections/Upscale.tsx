import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarButton, VarCategory, VarToggle } from 'react-var-ui';
import { ModelType } from '@metastable/types';

import { mainStore } from '../../../../stores/MainStore';
import { useUI } from '../../../../contexts/ui';
import { DownloadManager } from '../../../../modals/download';
import { VarModel } from '../components/VarModel';

export const Upscale: React.FC = observer(() => {
  const project = mainStore.project!;
  const upscale_models = mainStore.info.models.upscale_models;
  const { showModal } = useUI();

  const enabled = !!project.settings.models.upscale?.name;

  return (
    <VarCategory label="Upscale">
      {upscale_models?.[0] ? (
        <VarToggle
          label="Enable"
          path="models.upscale.enabled"
          value={enabled}
          onChange={value => {
            if (value && !project.settings.models.upscale?.name) {
              project.settings.models.upscale = {
                enabled: true,
                name: mainStore.defaultModelName(ModelType.UPSCALE_MODEL),
              };
            }
          }}
        />
      ) : (
        <VarButton
          buttonLabel="Download manager"
          onClick={() => showModal(<DownloadManager />)}
        />
      )}
      {enabled && (
        <VarModel path="models.upscale.name" modelType="upscale_models" />
      )}
    </VarCategory>
  );
});
