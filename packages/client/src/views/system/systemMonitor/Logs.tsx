import { observer } from 'mobx-react-lite';
import React from 'react';

import { Log } from '$components/log';
import { mainStore } from '$stores/MainStore';
import styles from './Logs.module.scss';

export const Logs: React.FC = observer(() => {
  return <Log className={styles.log} items={mainStore.backendLog} />;
});
