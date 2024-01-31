import React from 'react';
import { observer } from 'mobx-react-lite';
import { Model } from '@metastable/types';

import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components';
import { useModal } from '../../contexts/modal';
import { Card, List } from '../../components/list';
import { getStaticUrl } from '../../config';
import { fuzzy } from '../../utils/fuzzy';
import { removeFileExtension } from '../../utils/string';

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
          fuzzy(
            items,
            search,
            item => `${item.name} ${removeFileExtension(item.file.name)}`,
          )
        }
      >
        {item => (
          <Card
            name={item.name || removeFileExtension(item.file.name)}
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
