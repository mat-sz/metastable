import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarButton, VarCategory, VarSelect, VarToggle } from 'react-var-ui';

import { mainStore } from '../../../../stores/MainStore';
import { useUI } from '../../../../contexts/ui';
import { DownloadManager } from '../../../../modals/download';

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
                name: upscale_models[0].name,
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
        <VarSelect
          label="Model"
          path="models.upscale.name"
          options={upscale_models?.map(
            ({ name }) =>
              ({
                key: name,
                label: name,
              }) || [],
          )}
        />
      )}
    </VarCategory>
  );
});
