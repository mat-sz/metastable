import React from 'react';
import { observer } from 'mobx-react-lite';

import { Card, List } from '$components/list';
import { useUI } from '$components/ui';
import { mainStore } from '$stores/MainStore';
import styles from './Welcome.module.scss';
import { BsClockHistory, BsPlus } from 'react-icons/bs';
import { NewProject } from '$modals/newProject';
import { fuzzy } from '$utils/fuzzy';
import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';

export const Welcome: React.FC = observer(() => {
  const { showModal } = useUI();
  const data = mainStore.projects.all;

  return (
    <div className={styles.welcome}>
      <TabView
        defaultTab="recent"
        variant="large"
        direction="vertical"
        className={styles.view}
      >
        <Tabs buttonStyle="normal">
          <Tab id="recent" title="Recent" icon={<BsClockHistory />} />
        </Tabs>
        <TabContent>
          <TabPanel id="recent">
            <List
              header={<h2>Recent</h2>}
              small
              items={['new', ...data]}
              quickFilter={(data, search) =>
                fuzzy(
                  data.filter(item => typeof item === 'object'),
                  search,
                  item => item.name,
                )
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
