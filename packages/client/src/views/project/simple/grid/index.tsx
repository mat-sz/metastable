import { ProjectFileType } from '@metastable/types';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { Files } from './Files';
import styles from './index.module.scss';

export const Grid: React.FC = () => {
  const { t } = useTranslation('project');

  return (
    <TabView
      defaultTab={ProjectFileType.OUTPUT}
      direction="vertical"
      className={styles.wrapper}
    >
      <Tabs>
        {Object.values(ProjectFileType).map(type => (
          <Tab id={type} title={t(`project:fileType.${type}`)} key={type} />
        ))}
      </Tabs>
      <TabContent>
        {Object.values(ProjectFileType).map(type => (
          <TabPanel key={type} id={type}>
            <Files type={type} allowUpload={type !== ProjectFileType.OUTPUT} />
          </TabPanel>
        ))}
      </TabContent>
    </TabView>
  );
};
