import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarButton, VarSelect, VarToggle } from 'react-var-ui';

import { mainStore } from '../../../../stores/MainStore';
import { useUI } from '../../../../contexts/ui';
import { DownloadManager } from '../../../../modals/download';

export const Upscale: React.FC = observer(() => {
  const project = mainStore.project!;
  const upscale_models = mainStore.info.models.upscale_models;
  const { showModal } = useUI();

  const enabled = !!project.settings.models.upscale?.name;

  return (
    <>
      {upscale_models?.[0] ? (
        <VarToggle
          label="Enable"
          value={enabled}
          onChange={value => {
            if (value) {
              project.settings.models.upscale = {
                name: upscale_models[0].name,
              };
            } else {
              project.settings.models.upscale = undefined;
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
    </>
  );
});
