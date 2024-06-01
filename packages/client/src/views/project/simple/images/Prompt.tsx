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

  useHotkeys('Ctrl+Enter', () => {
    project.request();
  });

  return (
    <VarUI
      className={styles.prompt}
      onChange={values => {
        project.setSettings(values);
      }}
      values={toJS(project.settings)}
    >
      <VarCategory label="Prompt">
        <VarString label="Positive" path="prompt.positive" multiline />
        <VarString label="Negative" path="prompt.negative" multiline />
      </VarCategory>
      <div className={styles.actions}>
        <div>
          <Button onClick={open}>Load prompt from file</Button>
        </div>
        <div>
          <div className={styles.hint}>
            Hint: You can use <kbd>Ctrl</kbd>+<kbd>Enter</kbd> as well.
          </div>
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
