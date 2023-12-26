import React from 'react';
import { BsChevronRight } from 'react-icons/bs';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { mainStore } from '../../stores/MainStore';
import { List } from './components/List';
import { Loading } from '../../components';
import { OSItem } from './items/OSItem';
import { HardwareItem } from './items/HardwareItem';
import { PythonItem } from './items/PythonItem';
import { StorageItem } from './items/StorageItem';
import { ModelsItem } from './items/ModelsItem';

export const Setup: React.FC = observer(() => {
  const details = mainStore.setup.details;

  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Getting started...</h2>
        <div>Let's get this over with...</div>
      </div>
      {details ? (
        <>
          <div className={styles.list}>
            <List>
              <OSItem />
              <HardwareItem />
              <PythonItem />
              <StorageItem />
              <ModelsItem />
            </List>
          </div>
          <div className={styles.footer}>
            <button className={styles.cta}>
              <span>Continue</span>
              <BsChevronRight />
            </button>
          </div>
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
});
