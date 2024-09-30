import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import { VarCategory, VarString, VarSwitch } from '$components/var';

export const SettingsBackend: React.FC = observer(() => {
  return (
    <TabPanel id="backend">
      <VarCategory label="Arguments">
        <VarSwitch
          label="VRAM usage"
          path="comfy.vramMode"
          defaultValue="auto"
          options={[
            { key: 'auto', label: 'Automatic' },
            { key: 'cpu', label: 'CPU only' },
            { key: 'novram', label: 'Lowest' },
            { key: 'lowvram', label: 'Low' },
            { key: 'normalvram', label: 'Normal' },
            { key: 'highvram', label: 'High' },
            { key: 'gpu-only', label: 'GPU only' },
          ]}
        />
        <VarString
          label="Extra arguments"
          path="comfy.extraArgs"
          defaultValue=""
        />
      </VarCategory>
    </TabPanel>
  );
});
