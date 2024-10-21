import { ModelType } from '@metastable/types';
import clsx from 'clsx';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import {
  BsEmojiSmile,
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
import { General } from './sections/General';
import { Upscale } from './sections/Upscale';
import { useSimpleProject } from '../../context';
import { ModelArray } from '../common/ModelArray';
import { Pulid } from './sections/Pulid';

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
          {!!(
            mainStore.isFeatureEnabled('pulid') ||
            project.settings.pulid?.enabled
          ) && <Tab id="pulid" title="PuLID" icon={<BsEmojiSmile />} />}
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
              <ModelArray
                label="LoRA"
                path="models.lora"
                type={ModelType.LORA}
                strengthMin={-5}
                strengthMax={5}
              />
            </TabPanel>
            <TabPanel id="controlnets">
              <ModelArray
                label="Controlnet"
                path="models.controlnet"
                type={ModelType.CONTROLNET}
                hasImage
                strengthMin={0}
                strengthMax={2}
              />
            </TabPanel>
            <TabPanel id="ipadapters">
              <ModelArray
                label="IPAdapter"
                path="models.ipadapter"
                type={ModelType.IPADAPTER}
                hasImage
                hasClipVision
                strengthMin={0}
                strengthMax={1}
              />
            </TabPanel>
            <TabPanel id="upscale">
              <Upscale />
            </TabPanel>
            <TabPanel id="pulid">
              <Pulid />
            </TabPanel>
          </div>
        </VarUI>
      </TabView>
    );
  },
);
