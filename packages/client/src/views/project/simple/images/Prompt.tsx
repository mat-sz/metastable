import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { VarCategory, VarString, VarUI } from '$components/var';
import styles from './index.module.scss';
import { useSimpleProject } from '../../context';

export const Prompt: React.FC = observer(() => {
  const project = useSimpleProject();

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
        <Button onClick={() => project.request()} variant="primary">
          Generate
        </Button>
      </div>
    </VarUI>
  );
});
