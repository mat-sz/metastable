import clsx from 'clsx';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsWrench } from 'react-icons/bs';

import { Tab, TabPanel, Tabs, TabView } from '$components/tabs';
import { VarUI } from '$components/var';
import styles from './index.module.scss';
import { General } from './sections/General';
import { useTrainingProject } from '../../context';

interface SettingsProps {
  actions?: JSX.Element;
  className?: string;
}

export const Settings: React.FC<SettingsProps> = observer(
  ({ actions, className }) => {
    const project = useTrainingProject();

    return (
      <TabView
        defaultTab="general"
        direction="vertical"
        className={clsx(styles.settings, className)}
      >
        <Tabs buttonStyle="icon">
          <Tab id="general" title="General" icon={<BsWrench />} />
        </Tabs>
        <VarUI
          className={styles.var}
          onChange={values => {
            project.setSettings(values);
          }}
          values={toJS(project.settings)}
        >
          {!!actions && <div className={styles.actions}>{actions}</div>}
          <div>
            <TabPanel id="general">
              <General />
            </TabPanel>
          </div>
        </VarUI>
      </TabView>
    );
  },
);
