import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  VarCategory,
  VarNumber,
  VarSelect,
  VarSlider,
  VarToggle,
} from 'react-var-ui';

import { mainStore } from '../../../stores/MainStore';

export const Sampler: React.FC = observer(() => {
  const project = mainStore.project!;

  return (
    <VarCategory label="Sampler settings">
      <VarNumber
        label="Seed"
        path="sampler.seed"
        readOnly={project.settings.sampler.seed_randomize}
      />
      <VarToggle label="Randomize seed" path="sampler.seed_randomize" />
      <VarSlider
        label="CFG"
        path="sampler.cfg"
        min={0}
        max={30}
        step={0.5}
        defaultValue={8}
        showInput
      />
      <VarSlider
        label="Steps"
        path="sampler.steps"
        min={1}
        max={150}
        step={1}
        defaultValue={20}
        showInput
      />
      <VarSlider
        label="Denoise"
        path="sampler.denoise"
        min={0}
        max={1}
        step={0.01}
        defaultValue={1}
        showInput
      />
      <VarSelect
        label="Sampler"
        path="sampler.sampler"
        options={mainStore.info.samplers.map(name => ({
          key: name,
          label: name,
        }))}
      />
      <VarSelect
        label="Scheduler"
        path="sampler.scheduler"
        options={mainStore.info.schedulers.map(name => ({
          key: name,
          label: name,
        }))}
      />
    </VarCategory>
  );
});
