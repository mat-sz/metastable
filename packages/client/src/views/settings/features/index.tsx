import { TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsArrowClockwise } from 'react-icons/bs';
import semverGte from 'semver/functions/gte';

import { API } from '$api';
import { Alert } from '$components/alert';
import { LogSimple } from '$components/log';
import { TabPanel } from '$components/tabs';
import { VarToggle } from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

export const SettingsFeatures: React.FC = observer(() => {
  const bundleVersion = mainStore.config.data?.python.bundleVersion || '0.0.0';
  const available = semverGte(bundleVersion, '0.1.3');
  const features = available ? mainStore.info.features : [];

  return (
    <TabPanel id="features">
      <h2>Optional features</h2>
      <div className={styles.actions}>
        <button onClick={() => API.instance.restart.mutate()}>
          <BsArrowClockwise />
          <span>Restart backend</span>
        </button>
      </div>
      {!available && (
        <Alert variant="warning">
          <div>
            Adding features requires a bundle version greater or equal to 0.1.3.
          </div>
          <div>Current bundle version: {bundleVersion}</div>
          <div>
            You can reinstall the bundle in the{' '}
            <strong>About Metastable</strong> settings section.
          </div>
        </Alert>
      )}
      <Alert variant="warning">
        <div>Any changes here require a backend restart to be applied.</div>
      </Alert>
      {features.map(feature => {
        const task = mainStore.tasks.queues.settings.find(
          task =>
            task.type === 'feature.install' &&
            task.data.featureId === feature.id,
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
                  <VarToggle
                    path={`python.features.${feature.id}`}
                    defaultValue={feature.enabled}
                  />
                </>
              ) : (
                <button
                  onClick={() =>
                    API.instance.installFeature.mutate({
                      featureId: feature.id,
                    })
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
