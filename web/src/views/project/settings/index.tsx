import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction, toJS } from 'mobx';
import { VarCategory, VarUI } from 'react-var-ui';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { validateSettings } from '../../../helpers';
import { General } from './sections/General';
import { LoRAs } from './sections/LoRAs';
import { Controlnets } from './sections/Controlnets';
import { ModelType } from '../../../types/model';

interface SettingsProps {
  actions?: JSX.Element;
}

export const Settings: React.FC<SettingsProps> = observer(({ actions }) => {
  const project = mainStore.project!;

  const [tab, setTab] = useState('conditioning');
  const tabs: Record<string, { title: string; children: JSX.Element }> = {
    conditioning: {
      title: 'General',
      children: <General />,
    },
    loras: {
      title: 'LoRAs',
      children: <LoRAs />,
    },
    controlnets: {
      title: 'Controlnets',
      children: <Controlnets />,
    },
  };

  let error: string | undefined = undefined;

  const checkpointName = project.settings.models.base.name;
  const inputMode = project.settings.input.mode;
  if (!checkpointName) {
    error = 'No checkpoint selected.';
  } else if (
    mainStore.hasFile(ModelType.CHECKPOINT, checkpointName) !== 'downloaded'
  ) {
    error = 'Selected checkpoint does not exist.';
  } else if (project.settings.models.loras.length) {
    for (const lora of project.settings.models.loras) {
      if (!lora.name) {
        error = 'No LoRA selected.';
      } else if (
        mainStore.hasFile(ModelType.LORA, lora.name) !== 'downloaded'
      ) {
        error = 'Selected LoRA does not exist.';
      }
    }
  } else if (project.settings.models.controlnets.length) {
    for (const controlnet of project.settings.models.controlnets) {
      if (!controlnet.name) {
        error = 'No ControlNet selected.';
      } else if (
        mainStore.hasFile(ModelType.CHECKPOINT, controlnet.name) !==
        'downloaded'
      ) {
        error = 'Selected ControlNet does not exist.';
      } else if (!controlnet.image) {
        error = 'No image input for ControlNet selected.';
      }
    }
  } else if (
    (inputMode === 'image' || inputMode === 'image_masked') &&
    !project.settings.input.image
  ) {
    error = 'No input image selected.';
  } else if (mainStore.backendStatus !== 'ready') {
    error = 'Backend is not ready.';
  }

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
              project.settings = validateSettings(values);
            });
          }}
          values={toJS(project.settings)}
        >
          {!!error && <div className={styles.error}>{error}</div>}
          {!error && actions && (
            <VarCategory label="Actions">{actions}</VarCategory>
          )}
          {tabs[tab].children}
        </VarUI>
      </div>
    </div>
  );
});
