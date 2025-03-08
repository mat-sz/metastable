import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsArrowClockwise, BsBoxArrowDownLeft } from 'react-icons/bs';

import { API } from '$api';
import { Button } from '$components/button';
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
import styles from './index.module.scss';

const GB = 1024 * 1024 * 1024;
const FALLBACK_VRAM = 8 * GB;

export const SettingsTab: React.FC = observer(() => {
  const vram =
    (mainStore.info.torch?.memory.vram ||
      mainStore.info.vram ||
      FALLBACK_VRAM) / GB;

  return (
    <TabPanel id="settings">
      <VarCategory label="Actions" className={styles.actionsCategory}>
        <div className={styles.actions}>
          <Button
            onClick={() => API.instance.restart.mutate()}
            icon={<BsArrowClockwise />}
          >
            Restart backend
          </Button>
          <Button
            onClick={() => API.instance.unloadModels.mutate()}
            icon={<BsBoxArrowDownLeft />}
          >
            Unload all models
          </Button>
        </div>
      </VarCategory>
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
        <VarToggle
          label="Enable experimental optimizations"
          path="fast"
          defaultValue={false}
        />
        <VarString label="Extra arguments" path="extraArgs" defaultValue="" />
      </VarCategoryScope>
    </TabPanel>
  );
});
