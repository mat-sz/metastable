import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Welcome.module.scss';
import { mainStore } from '../../stores/MainStore';
import { DownloadManager } from '../../modals/download';
import { useUI } from '../../contexts/ui';
import { Card, List } from '../../components/list';

export const Welcome: React.FC = observer(() => {
  const { showModal } = useUI();
  const [projectName, setProjectName] = useState('');
  const data = mainStore.projects.recent;

  return (
    <div className={styles.wrapper}>
      <div className={styles.welcome}>
        <div className={styles.recent}>
          <h2>Recent</h2>
          <List small items={data}>
            {item => (
              <Card
                name={item.name}
                key={item.id}
                imageUrl={
                  item.lastOutput
                    ? mainStore.view(item.id, 'output', item.lastOutput)
                    : undefined
                }
                onClick={() => {
                  mainStore.projects.open(item.id);
                }}
              />
            )}
          </List>
        </div>
        <div className={styles.actions}>
          <h2>New</h2>
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
              <button onClick={() => showModal(<DownloadManager />)}>
                Download manager
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
