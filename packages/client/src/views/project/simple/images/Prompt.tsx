import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { Button } from '$components/button';
import { VarCategory, VarString, VarUI } from '$components/var';
import { useFileInput } from '$hooks/useFileInput';
import { PromptLoad } from '$modals/promptLoad';
import { modalStore } from '$stores/ModalStore';
import styles from './index.module.scss';
import { useSimpleProject } from '../../context';
import { StyleSelect } from '../common/StyleSelect';

export const Prompt: React.FC = observer(() => {
  const project = useSimpleProject();
  const onOpen = useCallback(
    (files: File[]) => {
      if (files[0]) {
        modalStore.show(<PromptLoad project={project} file={files[0]} />);
      }
    },
    [project],
  );
  const { open } = useFileInput(onOpen);
  const validationResult = project.validate();
  const isValid = !validationResult.errors.length;
  const sampleTime = project.stepTime?.sample;

  useHotkeys(
    'ctrl+enter',
    () => {
      project.request();
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
      <VarCategory label="Prompt">
        <StyleSelect className={styles.style} />
        <VarString label="Positive" path="prompt.positive" multiline />
        <VarString label="Negative" path="prompt.negative" multiline />
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
