import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import styles from './Prompt.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Prompt: React.FC = observer(() => {
  const project = mainStore.project;

  return (
    <div className={styles.prompt}>
      <select
        value={project.prompt.checkpoint_name}
        onChange={e => {
          runInAction(() => {
            project.prompt.checkpoint_name = e.target.value;
          });
        }}
      >
        {mainStore.info.checkpoints.map(name => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <textarea
        value={project.prompt.positive_prompt}
        onChange={e => {
          runInAction(() => {
            project.prompt.positive_prompt = e.target.value;
          });
        }}
      />
      <textarea
        value={project.prompt.negative_prompt}
        onChange={e => {
          runInAction(() => {
            project.prompt.negative_prompt = e.target.value;
          });
        }}
      />
      <select
        value={project.prompt.sampler_name}
        onChange={e => {
          runInAction(() => {
            project.prompt.sampler_name = e.target.value;
          });
        }}
      >
        {mainStore.info.samplers.map(name => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={project.prompt.scheduler_name}
        onChange={e => {
          runInAction(() => {
            project.prompt.scheduler_name = e.target.value;
          });
        }}
      >
        {mainStore.info.schedulers.map(name => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          project.request();
        }}
      >
        Request image
      </button>
    </div>
  );
});
