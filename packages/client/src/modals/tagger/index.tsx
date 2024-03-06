import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { VarCategory, VarSlider, VarToggle, VarUI } from 'react-var-ui';

import { Modal } from '$components/modal';
import { mainStore } from '$stores/MainStore';
import { VarModel } from '$components/varModel';
import { ModelType, ProjectTaggingSettings } from '@metastable/types';
import type { TrainingProject } from '$stores/project';
import styles from './index.module.scss';

interface Props {
  project: TrainingProject;
  inputs: string[];
}

export const Tagger: React.FC<Props> = observer(({ inputs, project }) => {
  const [settings, setSettings] = useState<ProjectTaggingSettings>({
    inputs,
    tagger: {
      name: mainStore.defaultModelName(ModelType.TAGGER),
    },
    threshold: 0.35,
    removeUnderscore: true,
  });
  return (
    <Modal title="Tagger">
      <div className={styles.settings}>
        <VarUI
          className={styles.prompt}
          onChange={setSettings}
          values={settings}
        >
          <VarCategory label="Tagger">
            <VarModel path="tagger.name" modelType={ModelType.TAGGER} />
          </VarCategory>
          <VarCategory label="Settings">
            <VarSlider
              label="Threshold"
              path="threshold"
              min={0}
              max={1}
              step={0.01}
              defaultValue={0.35}
              showInput
            />
            <VarToggle
              label="Remove underscore"
              path="removeUnderscore"
              defaultValue={true}
            />
          </VarCategory>
        </VarUI>
      </div>
      <button onClick={() => project.tag(settings)}>Start tagging</button>
    </Modal>
  );
});
