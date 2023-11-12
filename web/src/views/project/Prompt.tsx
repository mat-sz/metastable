import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import styles from './Prompt.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Prompt: React.FC = observer(() => {
  const project = mainStore.project;

  return (
    <div className={styles.prompt}>
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
