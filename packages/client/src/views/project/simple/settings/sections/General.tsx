import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';

import {
  VarAspectRatio,
  VarCategory,
  VarImage,
  VarModel,
  VarRandomNumber,
  VarSelect,
  VarSlider,
  VarString,
  VarToggle,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';

export const General: React.FC = observer(() => {
  const project = useSimpleProject();

  return (
    <>
      <VarCategory label="Checkpoint" collapsible>
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
      </VarCategory>
      <VarCategory label="Prompt" collapsible>
        <VarString label="Positive" path="conditioning.positive" multiline />
        <VarString label="Negative" path="conditioning.negative" multiline />
      </VarCategory>
      <VarCategory label="Input" collapsible>
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
            <VarAspectRatio
              label="Aspect ratio"
              widthPath="input.width"
              heightPath="input.height"
            />
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
      <VarCategory label="Sampler settings" collapsible defaultCollapsed={true}>
        <VarRandomNumber
          label="Seed"
          path="sampler.seed"
          isRandomizedPath="sampler.seed_randomize"
        />
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
      <VarCategory label="Other settings" collapsible defaultCollapsed={true}>
        <VarSelect
          label="Format"
          path="output.format"
          defaultValue="png"
          options={[
            { key: 'png', label: 'PNG' },
            { key: 'jpg', label: 'JPEG' },
          ]}
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
    </>
  );
});
