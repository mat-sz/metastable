import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsHdd, BsImage } from 'react-icons/bs';

import { Card, CardTag, CardTags, List } from '$components/list';
import { Modal, useModal } from '$components/modal';
import { mainStore } from '$stores/MainStore';
import { filesize } from '$utils/file';
import styles from './index.module.scss';

export const OpenProject: React.FC = observer(() => {
  const { close } = useModal();
  const data = mainStore.projects.all;

  return (
    <Modal title="Open project">
      <div className={styles.body}>
        <List
          items={data}
          quickFilter={(items, search) =>
            mainStore.searchFn(items, search, item => item.name)
          }
        >
          {item => (
            <Card
              name={item.name}
              key={item.id}
              imageUrl={item.lastOutput?.image.thumbnailUrl}
              onClick={() => {
                mainStore.projects.open(item.id);
                close();
              }}
            >
              <CardTags>
                {!!item.size && (
                  <CardTag icon={<BsHdd />}>{filesize(item.size)}</CardTag>
                )}
                {!!item.outputCount && (
                  <CardTag icon={<BsImage />}>{item.outputCount}</CardTag>
                )}
              </CardTags>
            </Card>
          )}
        </List>
      </div>
    </Modal>
  );
});
