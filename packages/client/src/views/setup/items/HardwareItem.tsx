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
  const gpu = setupStore.gpu;
  const shouldDisplayZludaToggle = gpu?.potentialTorchModes.includes('zluda');
  const isZludaAvailable = gpu?.torchModes.includes('zluda');

  return (
    <Item
      id="hardware"
      icon={<BsGpuCard />}
      title="Hardware"
      description={item.description}
      status={item.status}
    >
      {shouldDisplayZludaToggle && (
        <div className={styles.toggle}>
          <Toggle
            disabled={!isZludaAvailable}
            label="Use ZLUDA (Experimental)"
            value={setupStore.torchMode === 'zluda'}
            onChange={value => {
              runInAction(() => {
                setupStore.torchMode = value ? 'zluda' : 'directml';
              });
            }}
          />
          <div className={styles.info}>
            Requires HIP SDK 5.7 or 6.1 to be installed and a compatible AMD
            GPU. Not well tested, use at your own risk.
          </div>
        </div>
      )}
      <RequirementsTable requirements={item.requirements} />
    </Item>
  );
});
