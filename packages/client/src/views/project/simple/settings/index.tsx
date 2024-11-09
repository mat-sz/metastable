import clsx from 'clsx';
import { runInAction, toJS } from 'mobx';
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

import { Alert, Alerts } from '$components/alert';
import { FieldRenderer } from '$components/fieldRenderer';
import { FieldContext } from '$components/fieldRenderer/context';
import { Tab, TabPanel, Tabs, TabView } from '$components/tabs';
import { VarScope, VarUI } from '$components/var';
import { mainStore } from '$stores/MainStore';
import { filesize } from '$utils/file';
import styles from './index.module.scss';
import { General } from './sections/General';
import { useSimpleProject } from '../../context';

const FEATURE_ICONS: Record<string, JSX.Element> = {
  lora: <BsRecordCircle />,
  controlnet: <BsGearWideConnected />,
  ipadapter: <BsPlugFill />,
  upscale: <BsFullscreen />,
  pulid: <BsEmojiSmile />,
};

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
    const fields = mainStore.projectFields;
    const sections = Object.entries(fields);

    return (
      <TabView
        defaultTab="general"
        direction="vertical"
        className={clsx(styles.settings, className)}
      >
        <Tabs buttonStyle="icon">
          <Tab id="general" title="General" icon={<BsWrench />} />
          {sections.map(([key, section]) => (
            <Tab
              id={key}
              key={key}
              title={(section as any).label}
              icon={FEATURE_ICONS[key]}
            />
          ))}
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
              <Alerts>
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
              </Alerts>
            </div>
          )}
          <div>
            <TabPanel id="general">
              <General showPrompt={showPrompt} />
            </TabPanel>
            <VarScope path="featureData">
              <FieldContext.Provider
                value={{
                  architecture: project.architecture,
                  collapsed: project.ui.collapsed,
                  imageFiles: project.imageFiles,
                  onToggleCollapsed: (key, collapsed) => {
                    runInAction(() => {
                      if (!project.ui.collapsed) {
                        project.ui.collapsed = {};
                      }

                      project.ui.collapsed[key] = collapsed;
                    });
                  },
                }}
              >
                {sections.map(([key, section]) => (
                  <TabPanel id={key} key={key}>
                    <FieldRenderer id={key} field={section} isRoot />
                  </TabPanel>
                ))}
              </FieldContext.Provider>
            </VarScope>
          </div>
        </VarUI>
      </TabView>
    );
  },
);
