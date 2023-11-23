import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './OpenProject.module.scss';
import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components/Modal';
import { List } from './List';

export const OpenProject: React.FC = observer(() => {
  return (
    <Modal
      title="Open project"
      isOpen={mainStore.modal === 'open_project'}
      onClose={() => (mainStore.modal = undefined)}
    >
      <div className={styles.body}>
        <List data={mainStore.projects.recent} />
      </div>
    </Modal>
  );
});
