import React from 'react';
import { observer } from 'mobx-react-lite';
import { BsHddFill } from 'react-icons/bs';

import styles from './StorageItem.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { filesize } from '../../../helpers';
import { AvailableStorage } from '../../../components/availableStorage';
import { Item } from '../components/Item';

export const StorageItem: React.FC = observer(() => {
  const item = mainStore.setup.storage;

  const storage = mainStore.setup.details?.storage;
  const predicted = mainStore.setup.predictedStorage;
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
                <tr>
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
