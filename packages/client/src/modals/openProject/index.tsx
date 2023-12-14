import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components/Modal';
import { List } from './List';

export const OpenProject: React.FC = observer(() => {
  return (
    <Modal title="Open project">
      <div className={styles.body}>
        <List data={mainStore.projects.recent} />
      </div>
    </Modal>
  );
});
