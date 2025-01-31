import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsClockHistory, BsFiles, BsXLg } from 'react-icons/bs';

import { Button } from '$components/button';
import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';
import { ProjectList } from './ProjectList';
import { Social } from '../common/Social';

export const Home: React.FC = observer(() => {
  return (
    <div className={styles.home}>
      <TabView
        defaultTab="recent"
        variant="large"
        direction="vertical"
        className={styles.view}
      >
        <Tabs buttonStyle="normal">
          <Tab id="recent" title="Recent" icon={<BsClockHistory />} />
          <Tab id="all" title="All projects" icon={<BsFiles />} />
        </Tabs>
        <TabContent>
          <TabPanel id="recent">
            {!mainStore.config.data?.app?.hideWelcome && (
              <div className={styles.welcome}>
                <div className={styles.welcomeHeader}>
                  <h2>Welcome to {__APP_NAME__}</h2>
                  <Button
                    onClick={async () => {
                      const config = mainStore.config;
                      await config.refresh();
                      config.set({
                        ...config.data!,
                        app: { ...config.data!.app, hideWelcome: true },
                      });
                    }}
                    icon={<BsXLg />}
                  >
                    Close
                  </Button>
                </div>
                <Social />
              </div>
            )}
            <ProjectList
              title="Recent"
              projects={['new', ...mainStore.projects.recent]}
            />
          </TabPanel>
          <TabPanel id="all">
            <ProjectList
              title="All projects"
              searchable
              projects={mainStore.projects.all}
            />
          </TabPanel>
        </TabContent>
      </TabView>
    </div>
  );
});

export default Home;
