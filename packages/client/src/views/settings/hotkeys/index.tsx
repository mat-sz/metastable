import { observer } from 'mobx-react-lite';
import React from 'react';

import { Hotkey } from '$components/hotkey';
import { TabPanel } from '$components/tabs';
import { VarHotkey } from '$components/var/VarHotkey';
import { hotkeyGroups } from '$data/hotkeys';
import styles from './index.module.scss';

export const SettingsHotkeys: React.FC = observer(() => {
  return (
    <TabPanel id="hotkeys">
      <h2>Keyboard shortcuts</h2>
      {Object.entries(hotkeyGroups).map(([groupId, group]) => (
        <div key={groupId} className={styles.group}>
          <h3>{group.label}</h3>
          {Object.entries(group.hotkeys).map(([hotkeyId, hotkey]) => (
            <div key={hotkeyId} id={hotkeyId} className={styles.hotkey}>
              <div>{hotkey.label}</div>
              <div>
                <Hotkey keys={hotkey.defaultKeys} />
              </div>
              <div>
                <VarHotkey path={`app.hotkeys.${groupId}_${hotkeyId}`} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </TabPanel>
  );
});
