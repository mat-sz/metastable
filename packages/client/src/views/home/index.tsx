import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsClockHistory, BsFiles, BsPlus } from 'react-icons/bs';

import { Card, List } from '$components/list';
import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import { useUI } from '$components/ui';
import { NewProject } from '$modals/newProject';
import { mainStore } from '$stores/MainStore';
import { fuzzy } from '$utils/fuzzy';
import styles from './index.module.scss';

export const Home: React.FC = observer(() => {
  const { showModal } = useUI();

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
            <List
              header={<h2>Recent</h2>}
              small
              items={['new', ...mainStore.projects.recent]}
            >
              {item =>
                typeof item === 'string' ? (
                  <Card
                    name="New empty project"
                    icon={<BsPlus />}
                    onClick={() => showModal(<NewProject />)}
                  />
                ) : (
                  <Card
                    name={item.name}
                    key={item.id}
                    imageUrl={item.lastOutput?.image.thumbnailUrl}
                    onClick={() => {
                      mainStore.projects.open(item.id);
                    }}
                  />
                )
              }
            </List>
          </TabPanel>
          <TabPanel id="all">
            <List
              header={<h2>All projects</h2>}
              small
              items={mainStore.projects.all}
              quickFilter={(data, search) =>
                fuzzy(data, search, item => item.name)
              }
            >
              {item =>
                typeof item === 'string' ? (
                  <Card
                    name="New empty project"
                    icon={<BsPlus />}
                    onClick={() => showModal(<NewProject />)}
                  />
                ) : (
                  <Card
                    name={item.name}
                    key={item.id}
                    imageUrl={item.lastOutput?.image.thumbnailUrl}
                    onClick={() => {
                      mainStore.projects.open(item.id);
                    }}
                  />
                )
              }
            </List>
          </TabPanel>
        </TabContent>
      </TabView>
    </div>
  );
});