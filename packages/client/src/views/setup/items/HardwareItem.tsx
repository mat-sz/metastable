import React from 'react';
import { observer } from 'mobx-react-lite';
import { BsGpuCard } from 'react-icons/bs';

import { mainStore } from '@stores/MainStore';
import { RequirementsTable } from '../../../components/requirementsTable';
import { Item } from '../components/Item';

export const HardwareItem: React.FC = observer(() => {
  const item = mainStore.setup.hardware;

  return (
    <Item
      id="hardware"
      icon={<BsGpuCard />}
      title="Hardware"
      description={item.description}
      status={item.status}
    >
      <RequirementsTable requirements={item.requirements} />
    </Item>
  );
});
