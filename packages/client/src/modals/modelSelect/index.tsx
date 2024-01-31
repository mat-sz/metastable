import React from 'react';
import { observer } from 'mobx-react-lite';
import { Model } from '@metastable/types';

import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components';
import { useModal } from '../../contexts/modal';
import { Card, List } from '../../components/list';
import { getStaticUrl } from '../../config';
interface Props {
  type: string;
  onSelect: (model: Model) => void;
}

export const ModelSelect: React.FC<Props> = observer(({ type, onSelect }) => {
  const { close } = useModal();
  const data = mainStore.info.models[type] || [];

  return (
    <Modal title="Select model">
      <List
        items={data}
        quickFilter={(items, search) =>
          items.filter(item => item.file.name.includes(search))
        }
      >
        {item => (
          <Card
            name={item.name || item.file.name}
            key={item.file.name}
            imageUrl={
              item.image
                ? getStaticUrl(`/models/${type}/${item.image}`)
                : undefined
            }
            onClick={() => {
              onSelect(item);
              close();
            }}
          />
        )}
      </List>
    </Modal>
  );
});
