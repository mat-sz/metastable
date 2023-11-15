import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction, toJS } from 'mobx';
import { VarButton, VarCategory, VarUI } from 'react-var-ui';

import styles from './Prompt.module.scss';
import { mainStore } from '../../stores/MainStore';
import { Conditioning } from './prompt/Conditioning';
import { Checkpoint } from './prompt/Checkpoint';
import { LoRAs } from './prompt/LoRAs';
import { Input } from './prompt/Input';
import { Sampler } from './prompt/Sampler';

export const Prompt: React.FC = observer(() => {
  const project = mainStore.project!;

  const [tab, setTab] = useState('conditioning');
  const tabs: Record<string, { title: string; children: JSX.Element }> = {
    conditioning: {
      title: 'Conditioning',
      children: <Conditioning />,
    },
    checkpoint: {
      title: 'Checkpoint',
      children: <Checkpoint />,
    },
    loras: {
      title: 'LoRAs',
      children: <LoRAs />,
    },
    input: {
      title: 'Input',
      children: <Input />,
    },
    sampler: {
      title: 'Sampler',
      children: <Sampler />,
    },
  };

  return (
    <div className={styles.settings}>
      <ul className={styles.categories}>
        {Object.entries(tabs).map(([key, { title }]) => (
          <li
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? styles.active : undefined}
          >
            {title}
          </li>
        ))}
      </ul>
      <div className={styles.prompt}>
        <VarUI
          onChange={values => {
            runInAction(() => {
              project.prompt = values;
            });
          }}
          values={toJS(project.prompt)}
        >
          <VarCategory label="Actions">
            <VarButton
              buttonLabel="Request image"
              onClick={() => project.request()}
            />
          </VarCategory>
          {tabs[tab].children}
        </VarUI>
      </div>
    </div>
  );
});
