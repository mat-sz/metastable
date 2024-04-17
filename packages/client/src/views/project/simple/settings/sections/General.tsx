import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import {
  VarAspectRatio,
  VarButton,
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
import { imageModeOptions } from '$utils/image';
import { useSimpleProject } from '../../../context';
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
      </VarCategory>
      {showPrompt && (
        <VarCategory label="Prompt" collapsible>
          <VarString label="Positive" path="prompt.positive" multiline />
          <VarString label="Negative" path="prompt.negative" multiline />
        </VarCategory>
      )}
      <VarCategory label="Input" collapsible>
        <VarSelect
          label="Type"
          path="input.type"
          options={[
            { key: 'none', label: 'None' },
            { key: 'image', label: 'img2img' },
            { key: 'image_masked', label: 'Inpainting' },
          ]}
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
            <VarSelect
              label="Image mode"
              path="input.imageMode"
              options={imageModeOptions}
            />
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
