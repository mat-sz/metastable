import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components';
import { List } from './List';
import { useModal } from '../../contexts/modal';

interface Props {
  type: string;
  onSelect: (name: string) => void;
}

export const ModelSelect: React.FC<Props> = observer(({ type, onSelect }) => {
  const { close } = useModal();
  const [search, setSearch] = useState('');
  const available = mainStore.info.models[type] || [];

  return (
    <Modal title="Select model">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <List
        type={type}
        data={
          search
            ? available.filter(item => item.file.name.includes(search.trim()))
            : available
        }
        onSelect={model => {
          onSelect(model.file.name);
          close();
        }}
      />
    </Modal>
  );
});
