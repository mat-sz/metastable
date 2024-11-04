import { ModelType, ProjectTaggingSettings } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import {
  VarCategory,
  VarModel,
  VarSlider,
  VarToggle,
  VarUI,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import type { TrainingProject } from '$stores/project';
import styles from './index.module.scss';

interface Props {
  project: TrainingProject;
  inputs: string[];
}

export const ProjectTagger: React.FC<Props> = observer(
  ({ inputs, project }) => {
    const [settings, setSettings] = useState<ProjectTaggingSettings>({
      inputs,
      tagger: {
        name: mainStore.defaultModelName(ModelType.TAGGER),
      },
      threshold: 0.35,
      removeUnderscore: true,
    });

    return (
      <Modal title="Tagger" size="small">
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
        <ModalActions>
          <Button variant="secondary" onClick={() => close()}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              project.tag(settings);
              close();
            }}
          >
            Start
          </Button>
        </ModalActions>
      </Modal>
    );
  },
);
