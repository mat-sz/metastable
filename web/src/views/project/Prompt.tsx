import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction, toJS } from 'mobx';
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

import styles from './Prompt.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Prompt: React.FC = observer(() => {
  const project = mainStore.project!;

  return (
    <div className={styles.prompt}>
      <VarUI
        onChange={values => {
          runInAction(() => {
            project.prompt = values;
          });
        }}
        values={toJS(project.prompt)}
      >
        <VarCategory label="Models">
          <VarSelect
            label="Checkpoint"
            path="models.base.name"
            options={mainStore.info.checkpoints.map(name => ({
              key: name,
              label: name,
            }))}
          />
        </VarCategory>
        <VarArray path="models.loras">
          <VarCategory label="LoRA">
            <VarSelect
              label="Model"
              path="name"
              options={mainStore.info.loras.map(name => ({
                key: name,
                label: name,
              }))}
            />
            <VarSlider
              label="Strength"
              path="strength"
              min={0}
              max={2}
              step={0.01}
              defaultValue={1}
              showInput
            />
          </VarCategory>
        </VarArray>
        <VarButton
          buttonLabel="Add LoRA"
          onClick={() => {
            runInAction(() => {
              const prompt = toJS(project.prompt);
              prompt.models.loras.push({
                name: mainStore.info.loras[0],
                strength: 1,
              });
              project.prompt = prompt;
            });
          }}
        />
        <VarCategory label="Conditioning">
          <VarString label="Positive" path="conditioning.positive" multiline />
          <VarString label="Negative" path="conditioning.negative" multiline />
        </VarCategory>
        <VarCategory label="Latent">
          <VarSlider
            label="Width"
            path="input.width"
            min={64}
            max={2048}
            step={8}
            defaultValue={512}
            showInput
          />
          <VarSlider
            label="Height"
            path="input.height"
            min={64}
            max={2048}
            step={8}
            defaultValue={512}
            showInput
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
        </VarCategory>
        <VarCategory label="Sampler settings">
          <VarNumber
            label="Seed"
            path="sampler.seed"
            readOnly={project.prompt.sampler.seed_randomize}
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
