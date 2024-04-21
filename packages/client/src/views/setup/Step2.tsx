import { TaskState } from '@metastable/types';
import Ansi from 'ansi-to-react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsBox, BsDownload, BsHourglassSplit } from 'react-icons/bs';

import { Loading } from '$components/loading';
import { mainStore } from '$stores/MainStore';
import { Item } from './components/Item';
import { List } from './components/List';
import styles from './index.module.scss';

const TASK_ICONS: Record<string, React.ReactNode> = {
  download: <BsDownload />,
  extract: <BsBox />,
};

const TASK_TITLE: Record<string, string> = {
  download: 'Download dependencies',
  extract: 'Install dependencies',
};

export const Step2: React.FC = observer(() => {
  const details = mainStore.setup.details;
  const tasks = mainStore.tasks.queues.setup || [];

  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Installing...</h2>
        <div>This shouldn't take long...</div>
      </div>
      {details ? (
        <>
          <List hint="Click on an item to reveal more information.">
            {tasks.map(task => (
              <Item
                key={task.id}
                id={task.id}
                title={TASK_TITLE[task.type] || ''}
                icon={TASK_ICONS[task.type] || <BsHourglassSplit />}
                status={
                  task.state === TaskState.SUCCESS
                    ? 'ok'
                    : task.state === TaskState.FAILED
                      ? 'error'
                      : 'incomplete'
                }
                progress={(task.progress || 0) * 100}
              >
                <pre>
                  <Ansi>{task.log}</Ansi>
                </pre>
              </Item>
            ))}
          </List>
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
});
