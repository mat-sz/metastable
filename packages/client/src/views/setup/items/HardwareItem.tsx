import React from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../../stores/MainStore';
import { Item } from '../components/Item';
import { BsGpuCard } from 'react-icons/bs';
import { RequirementsTable } from '../../../components/requirementsTable';

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
