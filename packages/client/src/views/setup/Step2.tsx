import { TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18not';
import { BsBox, BsDownload, BsHourglassSplit } from 'react-icons/bs';

import { Loading } from '$components/loading';
import { mainStore } from '$stores/MainStore';
import { setupStore } from '$stores/SetupStore';
import { filesize } from '$utils/file';
import { timestr } from '$utils/string';
import { Item } from './components/Item';
import { List } from './components/List';
import styles from './index.module.scss';

const TASK_ICONS: Record<string, React.ReactNode> = {
  download: <BsDownload />,
  extract: <BsBox />,
};

export const Step2: React.FC = observer(() => {
  const details = setupStore.details;
  const tasks = mainStore.tasks.queues.setup || [];
  const { t } = useTranslation('setup');

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
                title={t(`setup:task.${task.type}`)}
                icon={TASK_ICONS[task.type] || <BsHourglassSplit />}
                status={
                  task.state === TaskState.SUCCESS
                    ? 'ok'
                    : task.state === TaskState.FAILED
                      ? 'error'
                      : 'incomplete'
                }
                description={
                  task.state === TaskState.RUNNING &&
                  typeof task.data?.speed !== 'undefined' ? (
                    <>
                      <span>{filesize(task.data.speed)}/s</span>
                      {!!(task.data.offset && task.data.size) && (
                        <>
                          <span>
                            {filesize(task.data.offset)}/
                            {filesize(task.data.size)}
                          </span>
                          {!!task.data.speed && (
                            <span>
                              ETA:{' '}
                              {timestr(
                                (task.data.size - task.data.offset) /
                                  task.data.speed,
                              )}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  ) : undefined
                }
                progress={(task.progress || 0) * 100}
              >
                <pre>{task.log}</pre>
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
