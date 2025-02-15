import { observer } from 'mobx-react-lite';
import React from 'react';

import { Hotkey } from '$components/hotkey';
import { TabPanel } from '$components/tabs';
import { VarCategory, VarHotkey, VarScope } from '$components/var';
import { hotkeyGroups } from '$data/hotkeys';
import styles from './index.module.scss';

export const SettingsHotkeys: React.FC = observer(() => {
  return (
    <TabPanel id="hotkeys">
      <h2>Keyboard shortcuts</h2>
      <VarScope path="app.hotkeys">
        {Object.entries(hotkeyGroups).map(([groupId, group]) => (
          <VarCategory
            label={group.label}
            key={groupId}
            className={styles.group}
          >
            {Object.entries(group.hotkeys).map(([hotkeyId, hotkey]) => (
              <div key={hotkeyId} id={hotkeyId} className={styles.hotkey}>
                <div>{hotkey.label}</div>
                <div>
                  <Hotkey keys={hotkey.defaultKeys} />
                </div>
                <div>
                  <VarHotkey path={`${groupId}_${hotkeyId}`} />
                </div>
              </div>
            ))}
          </VarCategory>
        ))}
      </VarScope>
    </TabPanel>
  );
});
