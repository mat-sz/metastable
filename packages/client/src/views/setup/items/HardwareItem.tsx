import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsGpuCard } from 'react-icons/bs';

import { Toggle } from '$components/toggle';
import { setupStore } from '$stores/SetupStore';
import styles from './HardwareItem.module.scss';
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
      {setupStore.shouldDisplayZludaToggle && (
        <div className={styles.toggle}>
          <Toggle
            label="Use ZLUDA (Experimental)"
            value={setupStore.useZluda}
            onChange={value => {
              runInAction(() => {
                setupStore.useZluda = value;
              });
            }}
          />
          <div className={styles.info}>
            Requires HIP SDK 5.7 to be installed and a compatible AMD GPU. Not
            well tested, use at your own risk.
          </div>
        </div>
      )}
      <RequirementsTable requirements={item.requirements} />
    </Item>
  );
});
