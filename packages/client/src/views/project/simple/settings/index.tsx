import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import {
  BsFullscreen,
  BsGearWideConnected,
  BsPlugFill,
  BsRecordCircle,
  BsWrench,
  BsXCircleFill,
} from 'react-icons/bs';

import { Tab, TabPanel, Tabs, TabView } from '$components/tabs';
import { VarUI } from '$components/var';
import styles from './index.module.scss';
import { Controlnets } from './sections/Controlnets';
import { General } from './sections/General';
import { IPAdapters } from './sections/IPAdapters';
import { LoRAs } from './sections/LoRAs';
import { Upscale } from './sections/Upscale';
import { useSimpleProject } from '../../context';

interface SettingsProps {
  actions?: JSX.Element;
}

export const Settings: React.FC<SettingsProps> = observer(({ actions }) => {
  const project = useSimpleProject();
  const error = project.validate();

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
        <Tab id="ipadapters" title="IPAdapters" icon={<BsPlugFill />} />
        <Tab id="upscale" title="Upscale" icon={<BsFullscreen />} />
      </Tabs>
      <VarUI
        className={styles.prompt}
        onChange={values => {
          project.setSettings(values);
        }}
        values={toJS(project.settings)}
      >
        <div className={styles.actions}>{!error && actions}</div>
        <div>
          {!!error && (
            <div className={styles.error}>
              <BsXCircleFill />
              <span>{error}</span>
            </div>
          )}
          <TabPanel id="general">
            <General />
          </TabPanel>
          <TabPanel id="loras">
            <LoRAs />
          </TabPanel>
          <TabPanel id="controlnets">
            <Controlnets />
          </TabPanel>
          <TabPanel id="ipadapters">
            <IPAdapters />
          </TabPanel>
          <TabPanel id="upscale">
            <Upscale />
          </TabPanel>
        </div>
      </VarUI>
    </TabView>
  );
});
