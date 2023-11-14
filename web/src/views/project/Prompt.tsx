import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction, toJS } from 'mobx';
import {
  VarButton,
  VarCategory,
  VarNumber,
  VarSelect,
  VarSlider,
  VarString,
  VarToggle,
  VarUI,
} from 'react-var-ui';

import styles from './Prompt.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Prompt: React.FC = observer(() => {
  const project = mainStore.project!;

  return (
    <div className={styles.prompt}>
      <VarUI
        updateValues={values => {
          runInAction(() => {
            project.prompt = values;
          });
        }}
        values={toJS(project.prompt)}
      >
        <VarCategory label="Models">
          <VarSelect
            label="Checkpoint"
            path="checkpoint_name"
            options={mainStore.info.checkpoints.map(name => ({
              key: name,
              label: name,
            }))}
          />
        </VarCategory>
        <VarCategory label="Conditioning">
          <VarString label="Positive prompt" path="positive_prompt" multiline />
          <VarString label="Negative prompt" path="negative_prompt" multiline />
        </VarCategory>
        <VarCategory label="Latent">
          <VarSlider
            label="Width"
            path="width"
            min={64}
            max={2048}
            step={8}
            defaultValue={512}
            showInput
          />
          <VarSlider
            label="Height"
            path="height"
            min={64}
            max={2048}
            step={8}
            defaultValue={512}
            showInput
          />
          <VarSlider
            label="Batch size"
            path="batch_size"
            min={1}
            max={16}
            step={1}
            defaultValue={1}
            showInput
          />
        </VarCategory>
        <VarCategory label="Sampler settings">
          <VarSlider
            label="CFG"
            path="cfg"
            min={0}
            max={30}
            step={0.5}
            defaultValue={8}
            showInput
          />
          <VarSlider
            label="Steps"
            path="steps"
            min={1}
            max={150}
            step={1}
            defaultValue={20}
            showInput
          />
          <VarNumber
            label="Seed"
            path="seed"
            readOnly={project.prompt.seed_randomize}
          />
          <VarToggle label="Randomize seed" path="seed_randomize" />
          <VarSelect
            label="Sampler"
            path="sampler_name"
            options={mainStore.info.samplers.map(name => ({
              key: name,
              label: name,
            }))}
          />
          <VarSelect
            label="Scheduler"
            path="scheduler_name"
            options={mainStore.info.schedulers.map(name => ({
              key: name,
              label: name,
            }))}
          />
        </VarCategory>
        <VarCategory label="Actions">
          <VarButton
            buttonLabel="Request image"
            onClick={() => project.request()}
          />
        </VarCategory>
      </VarUI>
    </div>
  );
});
