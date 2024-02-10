import React from 'react';
import { runInAction } from 'mobx';
import { FaPython } from 'react-icons/fa';
import { observer } from 'mobx-react-lite';

import { RequirementsTable } from '@components/requirementsTable';
import { Toggle } from '@components/toggle';
import { mainStore } from '@stores/MainStore';
import styles from './PythonItem.module.scss';
import { Item } from '../components/Item';

export const PythonItem: React.FC = observer(() => {
  const item = mainStore.setup.python;

  return (
    <Item
      id="python"
      icon={<FaPython />}
      title="Python"
      description={item.description}
      status={item.status}
    >
      <div className={styles.toggle}>
        <Toggle
          label="Download and configure a separate Python instance"
          value={mainStore.setup.pythonMode === 'static'}
          onChange={value => {
            runInAction(() => {
              mainStore.setup.pythonMode = value ? 'static' : 'system';
            });
          }}
        />
        <div className={styles.info}>
          Allowing Metastable to maintain its own Python installation will
          provide you with a smoother user experience. This will allow us to
          update Python and required packages separately without affecting your
          system-wide Python instance.
        </div>
      </div>
      <div className={styles.title}>
        System-wide Python installation details:
      </div>
      <RequirementsTable requirements={item.requirements} />
    </Item>
  );
});
