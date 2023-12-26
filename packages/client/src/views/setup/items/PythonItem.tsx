import React from 'react';
import { FaPython } from 'react-icons/fa';
import { observer } from 'mobx-react-lite';

import styles from './PythonItem.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { Item } from '../components/Item';
import { RequirementsTable } from '../../../components/requirementsTable';

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
      <div className={styles.title}>
        System-wide Python installation details:
      </div>
      <RequirementsTable requirements={item.requirements} />
    </Item>
  );
});
