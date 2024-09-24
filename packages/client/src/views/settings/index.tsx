import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsDownload, BsGear, BsPalette } from 'react-icons/bs';

import logo from '$/assets/logo.svg';
import { Tab, TabContent, Tabs, TabView } from '$components/tabs';
import { VarUI } from '$components/var';
import { mainStore } from '$stores/MainStore';
import { SettingsAbout } from './about';
import { SettingsDownloads } from './downloads';
import { SettingsGeneral } from './general';
import styles from './index.module.scss';
import { SettingsStyles } from './styles';

export const Settings: React.FC = observer(() => {
  const config = mainStore.config;

  if (!config.data) {
    return <div>Loading...</div>;
  }

  return (
    <VarUI
      values={toJS(config.data!)}
      onChange={value => config.set(value)}
      className={styles.settings}
    >
      <TabView defaultTab="general" variant="large" direction="vertical">
        <Tabs>
          <Tab id="general" title="General" icon={<BsGear />} />
          <Tab id="downloads" title="Downloads" icon={<BsDownload />} />
          <Tab id="styles" title="Prompt styles" icon={<BsPalette />} />
          <Tab
            id="about"
            title={`About ${__APP_NAME__}`}
            icon={<img src={logo} alt="Logo" />}
          />
        </Tabs>
        <TabContent className={styles.content}>
          <SettingsGeneral />
          <SettingsDownloads />
          <SettingsStyles />
          <SettingsAbout />
        </TabContent>
      </TabView>
    </VarUI>
  );
});
