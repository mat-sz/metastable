import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsHddFill } from 'react-icons/bs';

import { AvailableStorage } from '$components/availableStorage';
import { setupStore } from '$stores/SetupStore';
import { filesize } from '$utils/file';
import styles from './StorageItem.module.scss';
import { Item } from '../components/Item';

export const StorageItem: React.FC = observer(() => {
  const item = setupStore.storage;

  const storage = setupStore.details?.storage;
  const predicted = setupStore.predictedStorage;
  const entries = Object.entries(predicted.breakdown);

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
          path={storage.diskPath}
        />
      )}
      <div className={styles.predicted}>
        <div className={styles.info}>
          Predicted usage: approx. {filesize(predicted.total)}
        </div>
        {entries.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{filesize(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Item>
  );
});
