import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsChevronRight } from 'react-icons/bs';

import { Loading } from '$components/loading';
import { mainStore } from '$stores/MainStore';
import { List } from './components/List';
import styles from './index.module.scss';
import { HardwareItem } from './items/HardwareItem';
import { ModelsItem } from './items/ModelsItem';
import { OSItem } from './items/OSItem';
import { PythonItem } from './items/PythonItem';
import { StorageItem } from './items/StorageItem';

export const Step1: React.FC = observer(() => {
  const details = mainStore.setup.details;

  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Getting started...</h2>
        <div>Let's get this over with...</div>
      </div>
      {details ? (
        <>
          <List hint="Click on an item to reveal more options.">
            <OSItem />
            <HardwareItem />
            <PythonItem />
            <StorageItem />
            <ModelsItem />
          </List>
          <div className={styles.footer}>
            <button
              className={styles.cta}
              onClick={() => mainStore.setup.start()}
            >
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
