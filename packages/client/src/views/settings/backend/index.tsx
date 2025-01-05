import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import { VarCategory, VarSlider, VarString, VarSwitch } from '$components/var';
import { mainStore } from '$stores/MainStore';
import { Compatibility } from './compatibility';
import { General } from './general';

const GB = 1024 * 1024 * 1024;
const FALLBACK_VRAM = 8 * GB;

export const SettingsBackend: React.FC = observer(() => {
  const vram =
    (mainStore.info.torch?.memory.vram ||
      mainStore.info.vram ||
      FALLBACK_VRAM) / GB;

  return (
    <TabPanel id="backend">
      <h2>Backend</h2>
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
        <VarSlider
          label="Reserve VRAM"
          path="comfy.reserveVram"
          defaultValue={0}
          min={0}
          max={vram}
          step={1}
          unit="GB"
          showInput
        />
        <VarString
          label="Extra arguments"
          path="comfy.extraArgs"
          defaultValue=""
        />
      </VarCategory>
      <VarCategory label="Status">
        <General />
      </VarCategory>
      <VarCategory label="Compatibility">
        <Compatibility />
      </VarCategory>
    </TabPanel>
  );
});
