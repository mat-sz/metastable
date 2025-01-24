import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import { VarCategoryScope, VarPrompt, VarToggle } from '$components/var';
import { uiStore } from '$stores/UIStore';
import styles from './index.module.scss';

export const SettingsGeneral: React.FC = observer(() => {
  return (
    <TabPanel id="general">
      <h2>General</h2>
      <VarCategoryScope path="ui" label="User interface">
        <VarToggle path="fuzzySearch" label="Use fuzzy search" />
        {uiStore.notificationPermission !== 'denied' ? (
          <VarToggle
            path="notifications"
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
      </VarCategoryScope>
      <VarCategoryScope path="generation" label="Generation">
        <VarToggle path="preview" label="Enable previews" />
        <VarToggle
          path="imageMetadata"
          label="Store metadata in output image files"
        />
        <VarToggle path="memoryWarnings" label="Enable memory warnings" />
        <VarPrompt
          className={styles.prompt}
          path="defaultPrompt.positive"
          label="Default positive prompt"
        />
        <VarPrompt
          className={styles.prompt}
          path="defaultPrompt.negative"
          label="Default negative prompt"
        />
      </VarCategoryScope>
    </TabPanel>
  );
});
