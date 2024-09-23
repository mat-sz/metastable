import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import {
  VarAspectRatio,
  VarButton,
  VarCategory,
  VarImage,
  VarImageMode,
  VarInputType,
  VarModel,
  VarRandomNumber,
  VarSelect,
  VarSlider,
  VarString,
  VarSwitch,
  VarToggle,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';
import { ResolutionSelect } from '../../common/ResolutionSelect';
import { StyleSelect } from '../../common/StyleSelect';
import { MaskEditor } from '../maskEditor';

interface Props {
  showPrompt?: boolean;
}

export const General: React.FC<Props> = observer(({ showPrompt }) => {
  const project = useSimpleProject();
  const [maskEditorOpen, setMaskEditorOpen] = useState(false);

  return (
    <>
      {maskEditorOpen && !!project.settings.input.image && (
        <MaskEditor
          imageSrc={project.settings.input.image!}
          maskSrc={project.settings.input.mask}
          onClose={mask => {
            setMaskEditorOpen(false);
            if (mask) {
              project.settings.input.mask = mask;
            }
          }}
        />
      )}
      <VarCategory label="Checkpoint" collapsible>
        <VarSwitch
          label="Mode"
          path="checkpoint.mode"
          defaultValue="simple"
          options={[
            { key: 'simple', label: 'Simple' },
            { key: 'advanced', label: 'Advanced' },
          ]}
        />
        {project.settings.checkpoint.mode === 'advanced' ? (
          <>
            <VarModel
              path="checkpoint.unet.name"
              modelType={ModelType.UNET}
              label="UNET"
            />
            <VarModel
              path="checkpoint.clip1.name"
              modelType={ModelType.CLIP}
              label="CLIP 1"
            />
            <VarModel
              path="checkpoint.clip2.name"
              modelType={ModelType.CLIP}
              label="CLIP 2"
            />
            <VarModel
              path="checkpoint.vae.name"
              modelType={ModelType.VAE}
              label="VAE"
            />
          </>
        ) : (
          <VarModel
            path="checkpoint.name"
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
        )}
      </VarCategory>
      {showPrompt && (
        <VarCategory label="Prompt" collapsible>
          <StyleSelect />
          <VarString label="Positive" path="prompt.positive" multiline />
          <VarString label="Negative" path="prompt.negative" multiline />
        </VarCategory>
      )}
      <VarCategory label="Input" collapsible>
        <VarInputType
          label="Type"
          path="input.type"
          onChange={value => {
            if (value !== 'none' && !project.settings.input.imageMode) {
              project.settings.input.imageMode = 'stretch';
            }
          }}
        />
        {project.settings.input.type !== 'none' && (
          <>
            <VarImage
              label="Image"
              path="input.image"
              onChange={() => {
                project.settings.input.mask = undefined;
              }}
            />
            <VarImageMode label="Image mode" path="input.imageMode" />
            {project.settings.input.type === 'image_masked' && (
              <VarButton
                buttonLabel="Edit mask"
                onClick={() => setMaskEditorOpen(true)}
              />
            )}
            {project.settings.input.type === 'image' && (
              <VarSlider
                label="Strength"
                path="sampler.denoise"
                min={0}
                max={1}
                step={0.01}
                defaultValue={1}
                showInput
              />
            )}
          </>
        )}
      </VarCategory>
      <VarCategory label="Output" collapsible>
        <VarAspectRatio
          label="Aspect ratio"
          widthPath="output.width"
          heightPath="output.height"
        />
        <ResolutionSelect />
        <VarSlider
          label="Width"
          path="output.width"
          min={64}
          max={2048}
          step={8}
          defaultValue={512}
          showInput
          unit="px"
        />
        <VarSlider
          label="Height"
          path="output.height"
          min={64}
          max={2048}
          step={8}
          defaultValue={512}
          showInput
          unit="px"
        />
        <VarSlider
          label="Batch size"
          path="output.batchSize"
          min={1}
          max={16}
          step={1}
          defaultValue={1}
          showInput
        />
      </VarCategory>
      <VarCategory label="Sampler" collapsible defaultCollapsed={true}>
        <VarRandomNumber
          label="Seed"
          path="sampler.seed"
          isRandomizedPath="client.randomizeSeed"
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
        <VarSelect
          label="Sampler"
          path="sampler.samplerName"
          options={mainStore.info.samplers.map(name => ({
            key: name,
            label: name,
          }))}
        />
        <VarSelect
          label="Scheduler"
          path="sampler.schedulerName"
          options={mainStore.info.schedulers.map(name => ({
            key: name,
            label: name,
          }))}
        />
        <VarToggle label="Tiling" path="sampler.tiling" />
      </VarCategory>
      <VarCategory label="Other" collapsible defaultCollapsed={true}>
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
          path="checkpoint.clipSkip"
          min={0}
          max={12}
          step={1}
          defaultValue={0}
        />
      </VarCategory>
    </>
  );
});
