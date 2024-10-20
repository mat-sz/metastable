import { TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import semverGte from 'semver/functions/gte';

import { API } from '$api';
import { Alert } from '$components/alert';
import { LogSimple } from '$components/log';
import { TabPanel } from '$components/tabs';
import { VarToggle } from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

export const SettingsExtraFeatures: React.FC = observer(() => {
  const bundleVersion = mainStore.config.data?.python.bundleVersion || '0.0.0';
  const available = semverGte(bundleVersion, '0.1.3');
  const extraFeatures = available ? mainStore.info.extraFeatures : [];

  return (
    <TabPanel id="extraFeatures">
      <h2>Extra features</h2>
      {!available && (
        <Alert variant="warning">
          <div>
            Extra features require a bundle version greater or equal to 0.1.3.
          </div>
          <div>Current bundle version: {bundleVersion}</div>
          <div>
            You can reinstall the bundle in the{' '}
            <strong>About Metastable</strong> settings section.
          </div>
        </Alert>
      )}
      {extraFeatures.map(feature => {
        const task = mainStore.tasks.queues.settings.find(
          task =>
            task.type === 'extra.install' && task.data.featureId === feature.id,
        );
        return (
          <div key={feature.id} className={styles.feature}>
            <div className={styles.header}>
              <h3>{feature.name}</h3>
              {task ? (
                <span>
                  {task.state === TaskState.FAILED ? 'Error' : 'Installing...'}
                </span>
              ) : feature.installed ? (
                <>
                  <VarToggle value={feature.enabled} />
                </>
              ) : (
                <button
                  onClick={() =>
                    API.instance.installExtra.mutate({ featureId: feature.id })
                  }
                >
                  Install
                </button>
              )}
            </div>
            <div>{feature.description}</div>
            {!!task && (
              <div>
                <LogSimple log={task.log || ''} />
              </div>
            )}
          </div>
        );
      })}
    </TabPanel>
  );
});
