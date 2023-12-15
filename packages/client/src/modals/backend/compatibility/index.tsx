import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';

export const Compatibility: React.FC = observer(() => {
  const compatibility = mainStore.compatibility;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Expected</th>
          <th>Actual</th>
        </tr>
      </thead>
      <tbody>
        {compatibility.map((req, i) => (
          <tr
            key={i}
            className={clsx(styles.requirement, {
              [styles.error]: !req.satisfied,
            })}
          >
            <td>{req.satisfied ? <BsCheckCircleFill /> : <BsXCircleFill />}</td>
            <td>{req.name}</td>
            <td>{req.expected}</td>
            <td>{req.actual}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});
