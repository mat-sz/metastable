import React from 'react';
import { BsArchiveFill, BsDownload, BsHourglassSplit } from 'react-icons/bs';
import { observer } from 'mobx-react-lite';
import Ansi from 'ansi-to-react';

import styles from './index.module.scss';
import { mainStore } from '../../stores/MainStore';
import { List } from './components/List';
import { Loading } from '../../components';
import { Item } from './components/Item';
import { FaPython } from 'react-icons/fa';

const TASK_ICONS: Record<string, React.ReactNode> = {
  'python.download': <BsDownload />,
  'python.extract': <BsArchiveFill />,
  'python.install': <FaPython />,
  'models.download': <BsDownload />,
};

const TASK_TITLE: Record<string, string> = {
  'python.download': 'Download Python',
  'python.extract': 'Extract Python',
  'python.install': 'Install Python dependencies',
  'models.download': 'Download models',
};

export const Step2: React.FC = observer(() => {
  const details = mainStore.setup.details;
  const tasks = Object.entries(mainStore.setup.status?.tasks || {});

  return (
    <div className={styles.setup}>
      <div className={styles.header}>
        <h2>Installing...</h2>
        <div>This shouldn't take long...</div>
      </div>
      {details ? (
        <>
          <List hint="Click on an item to reveal more information.">
            {tasks.map(([id, task]) => (
              <Item
                key={id}
                id={id}
                title={TASK_TITLE[id] || ''}
                icon={TASK_ICONS[id] || <BsHourglassSplit />}
                status={
                  task.state === 'done'
                    ? 'ok'
                    : task.state === 'error'
                      ? 'error'
                      : 'incomplete'
                }
                progress={task.progress}
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
