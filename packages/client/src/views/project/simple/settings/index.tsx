import clsx from 'clsx';
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
  showPrompt?: boolean;
  actions?: JSX.Element;
  className?: string;
}

export const Settings: React.FC<SettingsProps> = observer(
  ({ showPrompt, actions, className }) => {
    const project = useSimpleProject();
    const error = project.validate();

    return (
      <TabView
        defaultTab="general"
        direction="vertical"
        className={clsx(styles.settings, className)}
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
          className={styles.var}
          onChange={values => {
            project.setSettings(values);
          }}
          values={toJS(project.settings)}
        >
          {!error && !!actions && (
            <div className={styles.actions}>{actions}</div>
          )}
          {!!error && (
            <div className={styles.errorWrapper}>
              <div className={styles.error}>
                <BsXCircleFill />
                <span>{error}</span>
              </div>
            </div>
          )}
          <div>
            <TabPanel id="general">
              <General showPrompt={showPrompt} />
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
  },
);
