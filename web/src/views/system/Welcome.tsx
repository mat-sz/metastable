import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Welcome.module.scss';
import { mainStore } from '../../stores/MainStore';

export const Welcome: React.FC = observer(() => {
  const [projectName, setProjectName] = useState('');
  return (
    <div className={styles.welcome}>
      <div>
        <h2>Welcome</h2>
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
        />
        <button onClick={() => mainStore.projects.create(projectName)}>
          Create a new project
        </button>
        <div>
          <ul>
            {mainStore.projects.recent.map(({ id, name }) => (
              <li key={id}>
                <button onClick={() => mainStore.projects.open(id)}>
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});
