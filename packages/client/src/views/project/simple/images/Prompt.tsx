import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import { Button } from '$components/button';
import { VarCategory, VarPrompt, VarUI } from '$components/var';
import { useFileInput } from '$hooks/useFileInput';
import { useHotkey } from '$hooks/useHotkey';
import { ProjectLoadPrompt } from '$modals/project';
import { modalStore } from '$stores/ModalStore';
import styles from './Prompt.module.scss';
import { useSimpleProject } from '../../context';
import { StyleSelect } from '../common/StyleSelect';

export const Prompt: React.FC = observer(() => {
  const project = useSimpleProject();
  const onFiles = useCallback(
    (files: File[]) => {
      if (files[0]) {
        modalStore.show(
          <ProjectLoadPrompt project={project} file={files[0]} />,
        );
      }
    },
    [project],
  );
  const { open } = useFileInput({ onFiles });
  const validationResult = project.validate();
  const isValid = !validationResult.errors.length;
  const sampleTime = project.stepTime?.sample;

  useHotkey(
    'prompt_submit',
    () => {
      project.request();
    },
    { enableOnFormTags: true },
  );
  useHotkey(
    'prompt_cancel',
    () => {
      project.cancel();
    },
    { enableOnFormTags: true },
  );

  return (
    <VarUI
      className={styles.prompt}
      onChange={values => {
        project.setSettings(values);
      }}
      values={toJS(project.settings)}
    >
      <VarCategory
        label={
          <>
            <span>Prompt</span>
            <StyleSelect className={styles.style} />
          </>
        }
      >
        <div className={styles.inputs}>
          <VarPrompt label="Positive" path="prompt.positive" />
          {project.showNegativePrompt && (
            <VarPrompt label="Negative" path="prompt.negative" />
          )}
        </div>
      </VarCategory>
      <div className={styles.actions}>
        <div>
          <Button onClick={open}>Load prompt from file</Button>
          {!!sampleTime && (
            <div className={styles.hint}>Last sample time: {sampleTime} ms</div>
          )}
        </div>
        <div>
          {project.isLastOutput && (
            <Button
              disabled={!isValid}
              onClick={() => project.discard()}
              variant="danger"
            >
              Discard
            </Button>
          )}
          {project.queued.length > 0 && (
            <Button onClick={() => project.clearQueue()} variant="danger">
              Clear queue
            </Button>
          )}
          {!!project.firstTask && (
            <Button onClick={() => project.cancel()} variant="danger">
              Cancel
            </Button>
          )}
          <Button
            disabled={!isValid}
            onClick={() => project.request()}
            variant="primary"
          >
            Generate
          </Button>
        </div>
      </div>
    </VarUI>
  );
});
