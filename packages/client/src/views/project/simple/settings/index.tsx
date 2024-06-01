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
} from 'react-icons/bs';

import { Alert } from '$components/alert';
import { Tab, TabPanel, Tabs, TabView } from '$components/tabs';
import { VarUI } from '$components/var';
import { mainStore } from '$stores/MainStore';
import { filesize } from '$utils/file';
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
    const validationResult = project.validate();
    const isValid = !validationResult.errors.length;
    const hasMessages = !!(
      validationResult.errors.length || validationResult.warnings.length
    );
    const memoryUsage = project.memoryUsage;

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
          {isValid && !!actions && (
            <div className={styles.actions}>{actions}</div>
          )}
          <div className={styles.headerItem}>
            <div className={styles.memory}>
              <span>Predicted memory usage:</span>
              <span>{filesize(memoryUsage)}</span>
              <span>/</span>
              <span>{filesize(mainStore.info.vram)}</span>
            </div>
          </div>
          {hasMessages && (
            <div className={styles.headerItem}>
              {validationResult.errors.map((message, i) => (
                <Alert variant="error" key={i}>
                  {message}
                </Alert>
              ))}
              {validationResult.warnings.map((message, i) => (
                <Alert variant="warning" key={i}>
                  {message}
                </Alert>
              ))}
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
