import React from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../../stores/MainStore';
import { Item } from '../components/Item';
import { BsHddFill } from 'react-icons/bs';
import { AvailableStorage } from '../../../components/availableStorage';

export const StorageItem: React.FC = observer(() => {
  const item = mainStore.setup.storage;

  const storage = mainStore.setup.details.storage;

  return (
    <Item
      id="storage"
      icon={<BsHddFill />}
      title="Storage"
      description={item.description}
      status={item.status}
    >
      {storage && (
        <AvailableStorage
          free={storage.free}
          total={storage.total}
          path={storage.dataRoot}
        />
      )}
    </Item>
  );
});
