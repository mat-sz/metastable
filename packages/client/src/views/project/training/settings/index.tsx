import React from 'react';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarNumber,
  VarSelect,
  VarSlider,
  VarString,
  VarToggle,
  VarUI,
} from 'react-var-ui';
import { BsPlay, BsX } from 'react-icons/bs';

import { ModelType } from '@metastable/types';
import { IconButton } from '@components/iconButton';
import { mainStore } from '@stores/MainStore';
import { ProgressBar } from '@components/progressBar';
import styles from './index.module.scss';
import { useTraningProject } from '../../context';
import { VarModel } from './components/VarModel';

export const Settings: React.FC = observer(() => {
  const project = useTraningProject();

  const queueItem = mainStore.trainingQueue.find(
    item => item.id === project.id,
  );

  return (
    <div className={styles.settings}>
      <div className={styles.actions}>
        {!!queueItem && (
          <div className={styles.progress}>
            <ProgressBar marquee />
          </div>
        )}
        {queueItem ? (
          <IconButton title="Stop training" onClick={() => project.cancel()}>
            <BsX />
          </IconButton>
        ) : (
          <IconButton title="Start training" onClick={() => project.request()}>
            <BsPlay />
          </IconButton>
        )}
      </div>
      <VarUI
        className={styles.prompt}
        onChange={values => {
          project.setSettings(values);
        }}
        values={toJS(project.settings)}
      >
        <VarCategory label="Checkpoint">
          <VarModel path="base.name" modelType={ModelType.CHECKPOINT} />
          <VarToggle label="SDXL" path="base.sdxl" />
        </VarCategory>
        <VarCategory label="Resolution">
          <VarSlider
            label="Width"
            path="resolution.width"
            min={64}
            max={2048}
            step={8}
            defaultValue={512}
            showInput
            unit="px"
          />
          <VarSlider
            label="Height"
            path="resolution.height"
            min={64}
            max={2048}
            step={8}
            defaultValue={512}
            showInput
            unit="px"
          />
        </VarCategory>
        <VarCategory label="Network settings">
          <VarNumber
            label="Dimensions"
            path="network.dimensions"
            defaultValue={16}
          />
          <VarNumber label="Alpha" path="network.alpha" defaultValue={8} />
        </VarCategory>
        <VarCategory label="Learning rates">
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
        </VarCategory>
        <VarCategory label="Learning rate scheduler">
          <VarSelect
            label="Name"
            path="learningRateScheduler.name"
            options={[
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
            ]}
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
        </VarCategory>
        <VarCategory label="Dataset settings">
          <VarArray path="dataset.activationTags">
            {(_, i) => (
              <div className={styles.tag}>
                <VarString label="Tag" path="" />
                <IconButton
                  title="Delete"
                  onClick={() => {
                    project.settings.dataset.activationTags =
                      project.settings.dataset.activationTags.filter(
                        (_, tagI) => tagI !== i,
                      );
                  }}
                >
                  <BsX />
                </IconButton>
              </div>
            )}
          </VarArray>
          <VarButton
            buttonLabel="Add activation tag"
            onClick={() => {
              project.settings.dataset.activationTags.push('');
            }}
          />
          <VarToggle label="Shuffle tags" path="dataset.shuffleTags" />
          <VarNumber label="Repeats" path="dataset.repeats" />
        </VarCategory>
        <VarCategory label="Limits">
          <VarNumber label="Training epochs" path="limits.trainingEpochs" />
          <VarNumber
            label="Save every X epochs"
            path="limits.saveEveryXEpochs"
          />
          <VarNumber label="Keep only X epochs" path="limits.keepOnlyXEpochs" />
          <VarNumber label="Batch size" path="limits.batchSize" />
        </VarCategory>
      </VarUI>
    </div>
  );
});
