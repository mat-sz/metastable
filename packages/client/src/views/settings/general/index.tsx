import { observer } from 'mobx-react-lite';
import React from 'react';

import { TabPanel } from '$components/tabs';
import {
  VarCategoryScope,
  VarPrompt,
  VarSlider,
  VarSwitch,
  VarToggle,
} from '$components/var';
import { useUIStore } from '$store/ui';
import styles from './index.module.scss';

export const SettingsGeneral: React.FC = observer(() => {
  const notificationPermission = useUIStore(
    state => state.notificationPermission,
  );
  const checkNotificationPermission = useUIStore(
    state => state.checkNotificationPermission,
  );

  return (
    <TabPanel id="general">
      <h2>General</h2>
      <VarCategoryScope path="ui" label="User interface">
        <VarSwitch
          path="theme"
          label="Theme"
          options={[
            { key: 'dark', label: 'Dark' },
            { key: 'light', label: 'Light' },
            { key: 'system', label: 'System' },
          ]}
          inline
        />
        <VarSlider
          path="fontSize"
          label="Font size"
          defaultValue={16}
          unit="px"
          step={1}
          min={12}
          max={20}
          showInput
        />
        <VarToggle path="fuzzySearch" label="Use fuzzy search" />
        {notificationPermission !== 'denied' ? (
          <VarToggle
            path="notifications"
            label="Enable notifications"
            onChange={value => {
              if (value) {
                checkNotificationPermission();
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
        <VarSwitch
          path="units.temperature"
          label="Temperature unit"
          options={[
            { key: 'C', label: '°C' },
            { key: 'F', label: '°F' },
          ]}
          inline
        />
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
