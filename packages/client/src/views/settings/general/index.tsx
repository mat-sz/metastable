import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import { VarCategory, VarToggle } from '$components/var';
import { uiStore } from '$stores/UIStore';
import styles from './index.module.scss';

export const SettingsGeneral: React.FC = observer(() => {
  return (
    <TabPanel id="general">
      <h2>General</h2>
      <VarCategory label="User interface">
        <VarToggle path="ui.fuzzySearch" label="Use fuzzy search" />
        {uiStore.notificationPermission !== 'denied' ? (
          <VarToggle
            path="ui.notifications"
            label="Enable notifications"
            onChange={value => {
              if (value) {
                uiStore.checkNotificationPermission();
              }
            }}
          />
        ) : (
          <>
            <VarToggle disabled value={false} label="Enable notifications" />
            <div className={styles.info}>
              <div>
                Notification permission has been rejected. To enable
                notifications, check your system settings.
              </div>
            </div>
          </>
        )}
      </VarCategory>
      <VarCategory label="Generation">
        <VarToggle path="generation.preview" label="Enable previews" />
        <VarToggle
          path="generation.imageMetadata"
          label="Store metadata in output image files"
        />
        <VarToggle
          path="generation.memoryWarnings"
          label="Enable memory warnings"
        />
      </VarCategory>
    </TabPanel>
  );
});
