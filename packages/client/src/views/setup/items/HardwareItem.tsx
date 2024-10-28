import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsGpuCard } from 'react-icons/bs';

import { setupStore } from '$stores/SetupStore';
import { RequirementsTable } from '../../../components/requirementsTable';
import { Item } from '../components/Item';

export const HardwareItem: React.FC = observer(() => {
  const item = setupStore.hardware;

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
