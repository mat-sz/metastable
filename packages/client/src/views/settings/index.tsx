import React from 'react';
import {
  BsDisplay,
  BsDownload,
  BsFolder,
  BsGear,
  BsKeyboard,
  BsPalette,
  BsPatchPlus,
  BsPeople,
} from 'react-icons/bs';

import { LogoIcon } from '$components/logoIcon';
import { Tab, TabContent, Tabs, TabView } from '$components/tabs';
import { VarUI } from '$components/var';
import { useConfigStore } from '$store/config';
import { useInstanceStore } from '$store/instance';
import { IS_DEV } from '$utils/config';
import { SettingsAbout } from './about';
import { SettingsBackend } from './backend';
import { SettingsComponents } from './components';
import { SettingsDownloads } from './downloads';
import { SettingsFeatures } from './features';
import { SettingsGeneral } from './general';
import { SettingsHotkeys } from './hotkeys';
import styles from './index.module.scss';
import { SettingsModelFolders } from './modelFolders';
import { SettingsStyles } from './styles';
import { SettingsUsers } from './users';

export const Settings: React.FC = () => {
  const config = useConfigStore(state => state.data);
  const setConfig = useConfigStore(state => state.update);
  const info = useInstanceStore(state => state.info);

  if (!config) {
    return <div>Loading...</div>;
  }

  const showUsers = info?.authAvailable;

  return (
    <VarUI values={config} onChange={setConfig} className={styles.settings}>
      <TabView
        className={styles.view}
        defaultTab="general"
        variant="large"
        direction="vertical"
      >
        <Tabs>
          <Tab id="general" title="General" icon={<BsGear />} />
          <Tab id="backend" title="Backend" icon={<BsDisplay />} />
          <Tab id="downloads" title="Downloads" icon={<BsDownload />} />
          <Tab id="modelFolders" title="Model folders" icon={<BsFolder />} />
          <Tab id="styles" title="Prompt styles" icon={<BsPalette />} />
          <Tab id="hotkeys" title="Keyboard shortcuts" icon={<BsKeyboard />} />
          <Tab id="features" title="Optional features" icon={<BsPatchPlus />} />
          {showUsers && <Tab id="users" title="Users" icon={<BsPeople />} />}
          <Tab id="about" title={`About ${__APP_NAME__}`} icon={<LogoIcon />} />
          {IS_DEV && (
            <Tab id="components" title="Component preview" icon={<BsGear />} />
          )}
        </Tabs>
        <TabContent className={styles.content}>
          <div className={styles.wrapper}>
            <SettingsGeneral />
            <SettingsBackend />
            <SettingsDownloads />
            <SettingsModelFolders />
            <SettingsStyles />
            <SettingsHotkeys />
            <SettingsFeatures />
            {showUsers && <SettingsUsers />}
            <SettingsAbout />
            {IS_DEV && <SettingsComponents />}
          </div>
        </TabContent>
      </TabView>
    </VarUI>
  );
};

export default Settings;
