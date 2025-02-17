import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import {
  VarAddModel,
  VarArray,
  VarButton,
  VarLabelActions,
  VarModel,
  VarNumber,
  VarSelect,
  VarSize,
  VarString,
  VarSwitch,
  VarToggle,
} from '$components/var';
import { useTrainingProject } from '../../../context';
import { SettingsCategory } from '../../common/SettingsCategory';
import styles from '../index.module.scss';

const optimizers = [
  'AdamW',
  'AdamW8bit',
  'Adafactor',
  'DAdaptation',
  'DAdaptAdaGrad',
  'DAdaptAdam',
  'DAdaptAdan',
  'DAdaptAdanIP',
  'DAdaptAdamPreprint',
  'DAdaptLion',
  'DAdaptSGD',
  'Lion',
  'Lion8bit',
  'PagedAdamW8bit',
  'PagedAdamW32bit',
  'PagedLion8bit',
  'Prodigy',
  'SGDNesterov',
  'SGDNesterov8bit',
];

const schedulers = [
  {
    key: 'linear',
    label: 'Linear',
  },
  {
    key: 'cosine',
    label: 'Cosine',
  },
  {
    key: 'cosine_with_restarts',
    label: 'Cosine with restarts',
  },
  {
    key: 'polynomial',
    label: 'Polynomial',
  },
  {
    key: 'constant',
    label: 'Constant',
  },
  {
    key: 'constant_with_warmup',
    label: 'Constant with warmup',
  },
  {
    key: 'adafactor',
    label: 'Adafactor',
  },
];

export const General: React.FC = observer(() => {
  const project = useTrainingProject();

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
          </>
        ) : (
          <VarModel
            path="checkpoint"
            modelType={ModelType.CHECKPOINT}
            label="Checkpoint"
          />
        )}
      </SettingsCategory>
      <SettingsCategory label="Input" sectionId="input">
        <VarSize
          widthPath="input.resolution.width"
          heightPath="input.resolution.height"
          lockedPath="input.resolution.lockAspectRatio"
        />
        <VarToggle label="Bucketing" path="input.bucketing" />
        <VarToggle label="Shuffle tags" path="dataset.shuffleTags" />
        <VarNumber label="Repeats" path="dataset.repeats" />
        <VarArray
          path="input.activationTags"
          footer={({ append }) => (
            <VarButton
              buttonLabel="Add activation tag"
              onClick={() => append('')}
            />
          )}
        >
          {({ remove }) => (
            <div className={styles.tag}>
              <VarString label="Tag" path="" />
              <IconButton title="Delete" onClick={remove}>
                <BsX />
              </IconButton>
            </div>
          )}
        </VarArray>
      </SettingsCategory>
      <SettingsCategory label="Network settings" sectionId="network">
        <VarNumber
          label="Dimensions"
          path="network.dimensions"
          defaultValue={16}
        />
        <VarNumber label="Alpha" path="network.alpha" defaultValue={8} />
      </SettingsCategory>
      <SettingsCategory label="Learning rates" sectionId="learningRates">
        <VarNumber
          label="Network"
          path="learningRates.network"
          step={0.000001}
        />
        <VarNumber label="Unet" path="learningRates.unet" step={0.000001} />
        <VarNumber
          label="Text encoder"
          path="learningRates.textEncoder"
          step={0.000001}
        />
      </SettingsCategory>
      <SettingsCategory
        label="Learning rate scheduler"
        sectionId="learningRateScheduler"
      >
        <VarSelect
          label="Name"
          path="learningRateScheduler.name"
          options={schedulers}
        />
        <VarNumber label="Restarts" path="learningRateScheduler.number" />
        <VarNumber
          label="Warmup ratio"
          path="learningRateScheduler.warmupRatio"
        />
        <VarToggle
          label="Min SNR gamma"
          path="learningRateScheduler.minSnrGamma"
        />
      </SettingsCategory>
      <SettingsCategory label="Optimizer" sectionId="optimizer">
        <VarSelect
          label="Name"
          path="optimizer.name"
          options={optimizers.map(name => ({ key: name, label: name }))}
        />
      </SettingsCategory>
      <SettingsCategory label="Limits" sectionId="limits">
        <VarNumber label="Training epochs" path="limits.trainingEpochs" />
        <VarNumber label="Save every X epochs" path="limits.saveEveryXEpochs" />
        <VarNumber label="Keep only X epochs" path="limits.keepOnlyXEpochs" />
        <VarNumber label="Batch size" path="limits.batchSize" />
      </SettingsCategory>
    </>
  );
});
