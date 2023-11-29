import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarCategory, VarSelect } from 'react-var-ui';

import { mainStore } from '../../../stores/MainStore';

export const Checkpoint: React.FC = observer(() => {
  return (
    <VarCategory label="Checkpoint">
      <VarSelect
        label="Checkpoint"
        path="models.base.name"
        options={
          mainStore.info.models.checkpoints?.map(({ name }) => ({
            key: name,
            label: name,
          })) || []
        }
      />
    </VarCategory>
  );
});
