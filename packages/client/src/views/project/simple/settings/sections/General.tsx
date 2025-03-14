import {
  Metamodel,
  ModelInputType,
  ModelOutputType,
  ModelType,
  ProjectFileType,
} from '@metastable/types';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import {
  IVarSelectOption,
  VarAddModel,
  VarArray,
  VarButton,
  VarImage,
  VarImageMode,
  VarInputType,
  VarLabelActions,
  VarMask,
  VarModel,
  VarNumber,
  VarOrientation,
  VarRandomNumber,
  VarSelect,
  VarSize,
  VarSlider,
  VarString,
  VarSwitch,
  VarToggle,
} from '$components/var';
import { useModalWrapperContext } from '$hooks/useModal';
import { ModelCreateMetamodel } from '$modals/model/createMetamodel';
import { mainStore } from '$stores/MainStore';
import { useSimpleProject } from '../../../context';
import { ResolutionSelect } from '../../common/ResolutionSelect';
import { SettingsCategory } from '../../common/SettingsCategory';
import { StyleSelect } from '../../common/StyleSelect';

interface Props {
  showPrompt?: boolean;
}

export const General: React.FC<Props> = observer(({ showPrompt }) => {
  const project = useSimpleProject();
  let outputOptions: IVarSelectOption[] = [
    { key: 'png', label: 'PNG' },
    { key: 'jpg', label: 'JPEG' },
  ];

  if (project.outputType === ModelOutputType.VIDEO) {
    outputOptions = [{ key: 'png', label: 'APNG' }];
  }

  const showInputSection =
    project.inputTypes.length > 1 ||
    project.inputTypes[0] !== ModelInputType.NONE;

  const modalWrapper = useModalWrapperContext();

  return (
    <>
      <SettingsCategory label="Checkpoint" path="models" sectionId="checkpoint">
        <VarSwitch
          label="Mode"
          path="mode"
          defaultValue="simple"
          options={[
            { key: 'simple', label: 'Simple' },
            { key: 'advanced', label: 'Advanced' },
          ]}
          inline
        />
        {project.settings.models.mode === 'advanced' ? (
          <>
            <VarModel
              path="diffusionModel"
              modelType={[ModelType.CHECKPOINT, ModelType.DIFFUSION_MODEL]}
              label="Diffusion model / checkpoint"
            />
            <VarModel path="vae" modelType={ModelType.VAE} label="VAE" />
            <VarArray
              path="textEncoders"
              footer={({ append }) => (
                <VarAddModel
                  label="Text encoder"
                  modelType={ModelType.TEXT_ENCODER}
                  onSelect={model => {
                    append(model.mrn);
                  }}
                />
              )}
            >
              {({ remove }) => (
                <VarModel
                  path=""
                  modelType={ModelType.TEXT_ENCODER}
                  label={
                    <VarLabelActions
                      label="Text encoder"
                      actions={
                        <IconButton onClick={remove}>
                          <BsX />
                        </IconButton>
                      }
                    />
                  }
                />
              )}
            </VarArray>
            <VarButton
              buttonLabel="Create Metacheckpoint"
              onClick={() => {
                const projectModels = project.settings.models;
                const models: Metamodel['models'] = {
                  diffusionModel: projectModels.diffusionModel,
                  textEncoders: projectModels.textEncoders,
                  vae: projectModels.vae,
                };
                modalWrapper.open(
                  <ModelCreateMetamodel
                    models={models}
                    onSave={mrn => {
                      runInAction(() => {
                        project.settings.models = {
                          mode: 'simple',
                          checkpoint: mrn,
                        };
                      });
                    }}
                  />,
                );
              }}
            />
          </>
        ) : (
          <VarModel
            path="checkpoint"
            modelType={ModelType.CHECKPOINT}
            label="Checkpoint"
            onSelect={model => {
              if (!model) {
                return;
              }

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
      </SettingsCategory>
      {showPrompt && (
        <SettingsCategory label="Prompt" sectionId="prompt">
          <StyleSelect />
          <VarString label="Positive" path="prompt.positive" multiline />
          {project.showNegativePrompt && (
            <VarString label="Negative" path="prompt.negative" multiline />
          )}
        </SettingsCategory>
      )}
      {showInputSection && (
        <SettingsCategory label="Input" sectionId="input">
          <VarInputType
            label="Type"
            path="input.type"
            onChange={value => {
              if (
                value !== ModelInputType.NONE &&
                !project.settings.input.imageMode
              ) {
                project.settings.input.imageMode = 'stretch';
              }
            }}
            supportedTypes={project.inputTypes}
          />
          {project.settings.input.type !== ModelInputType.NONE && (
            <>
              <VarImage
                label="Image"
                path="input.image"
                onChange={() => {
                  runInAction(() => {
                    project.settings.input.mask = undefined;
                  });
                }}
                imageBrowserProps={{
                  defaultParentId: ProjectFileType.INPUT,
                  files: project.imageFiles,
                  showBreadcrumbs: true,
                }}
              />
              <VarImageMode label="Image mode" path="input.imageMode" />
              {project.settings.input.type === ModelInputType.IMAGE_MASKED && (
                <>
                  <VarMask
                    label="Mask"
                    path="input.mask"
                    imagePath="input.image"
                    imageBrowserProps={{
                      defaultParentId: ProjectFileType.MASK,
                      files: project.imageFiles,
                    }}
                  />
                  <VarSlider
                    label="Pad edges"
                    path="input.padEdges"
                    min={0}
                    max={512}
                    step={1}
                    defaultValue={0}
                    showInput
                    unit="px"
                  />
                </>
              )}
              {project.settings.input.type === ModelInputType.IMAGE && (
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
        </SettingsCategory>
      )}
      <SettingsCategory label="Output" sectionId="output">
        <VarSwitch
          label="Size"
          path="output.sizeMode"
          options={[
            { key: 'auto', label: 'Automatic' },
            { key: 'custom', label: 'Custom' },
          ]}
          inline
        />
        <VarOrientation
          label="Orientation"
          orientationPath="output.orientation"
          widthPath="output.width"
          heightPath="output.height"
          autoSizes={
            project.settings.output.sizeMode === 'auto'
              ? project.autoSizes
              : undefined
          }
        />
        {project.settings.output.sizeMode === 'custom' && (
          <>
            <ResolutionSelect />
            <VarSize
              widthPath="output.width"
              heightPath="output.height"
              lockedPath="output.lockAspectRatio"
            />
          </>
        )}
        {project.outputType === ModelOutputType.VIDEO && (
          <VarNumber
            label="Frames"
            path="output.frames"
            min={1}
            max={150}
            step={1}
            defaultValue={1}
            inline
          />
        )}
        <VarNumber
          label="Batch size"
          path="output.batchSize"
          min={1}
          max={16}
          step={1}
          defaultValue={1}
          inline
        />
      </SettingsCategory>
      <SettingsCategory label="Sampler" sectionId="sampler">
        <VarSwitch
          label="Quality"
          path="sampler.quality"
          defaultValue="medium"
          options={[
            { key: 'low', label: 'Low' },
            { key: 'medium', label: 'Medium' },
            { key: 'high', label: 'High' },
            { key: 'custom', label: 'Custom' },
          ]}
        />
        <VarRandomNumber
          label="Seed"
          path="sampler.seed"
          isRandomizedPath="client.randomizeSeed"
        />
        <VarSlider
          label="Guidance"
          path="sampler.cfg"
          min={0}
          max={30}
          step={0.5}
          defaultValue={8}
          showInput
        />
        {project.settings.sampler.quality === 'custom' && (
          <>
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
          </>
        )}
        <VarToggle label="Tiling" path="sampler.tiling" />
      </SettingsCategory>
      <SettingsCategory label="Other" sectionId="other">
        <VarSwitch
          label="Format"
          path="output.format"
          defaultValue={outputOptions[0].key}
          options={outputOptions}
          inline
        />
        <VarSlider
          label="CLIP skip last layers"
          path="models.clipSkip"
          min={0}
          max={12}
          step={1}
          defaultValue={0}
        />
      </SettingsCategory>
    </>
  );
});
