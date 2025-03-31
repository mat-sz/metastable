import React from 'react';

import { Log } from '$components/log';
import { useBackendStore } from '$store/backend';
import styles from './Logs.module.scss';

export const Logs: React.FC = () => {
  const log = useBackendStore(state => state.log);
  return <Log className={styles.log} items={log} />;
};
