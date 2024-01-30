import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components';
import { Card, List } from '../../components/list';

export const OpenProject: React.FC = observer(() => {
  const data = mainStore.projects.recent;

  return (
    <Modal title="Open project">
      <div className={styles.body}>
        <List>
          {data.map(item => (
            <Card
              name={item.name}
              key={item.id}
              imageUrl={
                item.lastOutput
                  ? mainStore.view(item.id, 'output', item.lastOutput)
                  : undefined
              }
              onClick={() => {
                // TODO: Close modal.
                mainStore.projects.open(item.id);
              }}
            />
          ))}
        </List>
      </div>
    </Modal>
  );
});
