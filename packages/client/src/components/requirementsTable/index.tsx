import { Requirement } from '@metastable/types';
import clsx from 'clsx';
import React from 'react';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';

import styles from './index.module.scss';

interface Props {
  requirements: Requirement[];
}

export const RequirementsTable: React.FC<Props> = ({ requirements }) => {
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
        {requirements.map((req, i) => (
          <tr
            key={i}
            className={clsx(styles.requirement, {
              [styles.error]: !req.satisfied,
            })}
          >
            <td>{req.satisfied ? <BsCheckCircleFill /> : <BsXCircleFill />}</td>
            <td>{req.name}</td>
            <td>{String(req.expected)}</td>
            <td>{String(req.actual)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
