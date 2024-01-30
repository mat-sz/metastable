import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components';
import { useModal } from '../../contexts/modal';
import { Search } from '../../components/search';
import { Card, List } from '../../components/list';
import { getStaticUrl } from '../../config';

interface Props {
  type: string;
  onSelect: (name: string) => void;
}

export const ModelSelect: React.FC<Props> = observer(({ type, onSelect }) => {
  const { close } = useModal();
  const [search, setSearch] = useState('');
  const available = mainStore.info.models[type] || [];

  const data = search
    ? available.filter(item => item.file.name.includes(search.trim()))
    : available;

  return (
    <Modal title="Select model">
      <Search value={search} onChange={setSearch} />
      <List>
        {data.map(item => (
          <Card
            name={item.name || item.file.name}
            key={item.file.name}
            imageUrl={
              item.image
                ? getStaticUrl(`/models/${type}/${item.image}`)
                : undefined
            }
            onClick={() => {
              onSelect(item.file.name);
              close();
            }}
          />
        ))}
      </List>
    </Modal>
  );
});
