import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components';
import { Card, List } from '../../components/list';
import { useModal } from '../../contexts/modal';
import { fuzzy } from '../../utils/fuzzy';

export const OpenProject: React.FC = observer(() => {
  const { close } = useModal();
  const data = mainStore.projects.recent;

  return (
    <Modal title="Open project">
      <div className={styles.body}>
        <List
          items={data}
          quickFilter={(items, search) =>
            fuzzy(items, search, item => item.name)
          }
        >
          {item => (
            <Card
              name={item.name}
              key={item.id}
              imageUrl={
                item.lastOutput
                  ? mainStore.view(item.id, 'output', item.lastOutput)
                  : undefined
              }
              onClick={() => {
                mainStore.projects.open(item.id);
                close();
              }}
            />
          )}
        </List>
      </div>
    </Modal>
  );
});
