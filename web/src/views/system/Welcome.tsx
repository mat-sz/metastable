import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Welcome.module.scss';
import { mainStore } from '../../stores/MainStore';
import { List } from '../projects/List';

export const Welcome: React.FC = observer(() => {
  const [projectName, setProjectName] = useState('');
  return (
    <div className={styles.welcome}>
      <div className={styles.actions}>
        <h2>Welcome</h2>
        {mainStore.info.models.checkpoints?.[0] ? (
          <>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
            />
            <button onClick={() => mainStore.projects.create(projectName)}>
              Create a new project
            </button>
          </>
        ) : (
          <>
            <div>
              Please install a checkpoint model before creating a new project.
            </div>
            <button onClick={() => mainStore.downloads.open()}>
              Download manager
            </button>
          </>
        )}
      </div>
      <List data={mainStore.projects.recent} />
    </div>
  );
});
