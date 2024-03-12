import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  VarCategory,
  VarImage,
  VarNumber,
  VarSelect,
  VarSlider,
  VarString,
  VarToggle,
} from 'react-var-ui';
import { ModelType } from '@metastable/types';

import { VarModel } from '$components/varModel';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';

export const General: React.FC = observer(() => {
  const project = useSimpleProject();

  return (
    <>
      <VarCategory label="Checkpoint">
        <VarModel
          path="models.base.name"
          modelType={ModelType.CHECKPOINT}
          onSelect={model => {
            const samplerSettings = model.metadata?.samplerSettings;
            if (samplerSettings) {
              project.settings.sampler = {
                ...project.settings.sampler,
                ...samplerSettings,
              };
            }
          }}
        />
        <VarSlider
          label="CLIP skip last layers"
          path="models.base.clip_skip"
          min={0}
          max={12}
          step={1}
          defaultValue={0}
        />
      </VarCategory>
      <VarCategory label="Conditioning">
        <VarString label="Positive" path="conditioning.positive" multiline />
        <VarString label="Negative" path="conditioning.negative" multiline />
      </VarCategory>
      <VarCategory label="Input">
        <VarSelect
          label="Mode"
          path="input.mode"
          options={[
            { key: 'empty', label: 'Empty latent image' },
            { key: 'image', label: 'Image' },
            { key: 'image_masked', label: 'Image with mask (inpainting)' },
          ]}
        />
        {project.settings.input.mode === 'empty' ? (
          <>
            <VarSlider
              label="Width"
              path="input.width"
              min={64}
              max={2048}
              step={8}
              defaultValue={512}
              showInput
              unit="px"
            />
            <VarSlider
              label="Height"
              path="input.height"
              min={64}
              max={2048}
              step={8}
              defaultValue={512}
              showInput
              unit="px"
            />
            <VarSlider
              label="Batch size"
              path="input.batch_size"
              min={1}
              max={16}
              step={1}
              defaultValue={1}
              showInput
            />
          </>
        ) : (
          <>
            <VarImage label="Image" path="input.image" />
          </>
        )}
      </VarCategory>
      <VarCategory label="Output">
        <VarSelect
          label="Format"
          path="output.format"
          defaultValue="png"
          options={[
            { key: 'png', label: 'PNG' },
            { key: 'jpg', label: 'JPEG' },
          ]}
        />
      </VarCategory>
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
        <VarToggle label="Tiling" path="sampler.tiling" />
      </VarCategory>
    </>
  );
});
