import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction, toJS } from 'mobx';
import { VarUI } from 'react-var-ui';

import styles from './index.module.scss';
import { BsWrench, BsRecordCircle, BsGearWideConnected } from 'react-icons/bs';
import { GiResize } from 'react-icons/gi';

import { mainStore } from '../../../stores/MainStore';
import { fixSettings, validateProject } from '../../../helpers';
import { General } from './sections/General';
import { LoRAs } from './sections/LoRAs';
import { Controlnets } from './sections/Controlnets';
import { Upscale } from './sections/Upscale';
import { Tab, TabPanel, TabView, Tabs } from '../../../components';

interface SettingsProps {
  actions?: JSX.Element;
}

export const Settings: React.FC<SettingsProps> = observer(({ actions }) => {
  const project = mainStore.project!;

  const error = validateProject(project);

  return (
    <TabView
      defaultTab="general"
      direction="vertical"
      className={styles.settings}
    >
      <Tabs buttonStyle="icon">
        <Tab id="general" title="General" icon={<BsWrench />} />
        <Tab id="loras" title="LoRAs" icon={<BsRecordCircle />} />
        <Tab
          id="controlnets"
          title="Controlnets"
          icon={<BsGearWideConnected />}
        />
        <Tab id="upscale" title="Upscale" icon={<GiResize />} />
      </Tabs>
      <div className={styles.actions}>{!error && actions}</div>
      <VarUI
        className={styles.prompt}
        onChange={values => {
          runInAction(() => {
            project.settings = fixSettings(values);
          });
        }}
        values={toJS(project.settings)}
      >
        {!!error && <div className={styles.error}>{error}</div>}
        <TabPanel id="general">
          <General />
        </TabPanel>
        <TabPanel id="loras">
          <LoRAs />
        </TabPanel>
        <TabPanel id="controlnets">
          <Controlnets />
        </TabPanel>
        <TabPanel id="upscale">
          <Upscale />
        </TabPanel>
      </VarUI>
    </TabView>
  );
});
