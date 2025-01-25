import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import {
  VarCategory,
  VarCategoryScope,
  VarSlider,
  VarString,
  VarSwitch,
  VarToggle,
} from '$components/var';
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
      <VarCategoryScope path="comfy" label="Arguments">
        <VarSwitch
          label="VRAM usage"
          path="vramMode"
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
          path="reserveVram"
          defaultValue={0}
          min={0}
          max={vram}
          step={1}
          unit="GB"
          showInput
        />
        <VarToggle label="Run VAE on CPU" path="cpuVae" defaultValue={false} />
        <VarString label="Extra arguments" path="extraArgs" defaultValue="" />
      </VarCategoryScope>
      <VarCategory label="Status">
        <General />
      </VarCategory>
      <VarCategory label="Compatibility">
        <Compatibility />
      </VarCategory>
    </TabPanel>
  );
});
