import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsClockHistory, BsFiles, BsStar, BsXLg } from 'react-icons/bs';

import { Button } from '$components/button';
import {
  Tab,
  TabCategory,
  TabContent,
  TabDivider,
  TabPanel,
  Tabs,
  TabView,
} from '$components/tabs';
import { TagIcon } from '$components/tagIcon';
import { useConfigStore } from '$store/config';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';
import { ProjectList } from './ProjectList';
import { Social } from '../common/Social';

export const Home: React.FC = observer(() => {
  const { recent, all, favorite, tags } = mainStore.projects;
  const showWelcome = useConfigStore(state => !state.data?.app.hideWelcome);
  const setConfigValue = useConfigStore(state => state.set);

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
          {!!favorite.length && (
            <Tab id="favorite" title="Favorite" icon={<BsStar />} />
          )}
          <Tab id="all" title="All projects" icon={<BsFiles />} />
          {!!tags.length && (
            <>
              <TabDivider />
              <TabCategory>Tags</TabCategory>
              {tags.map(tag => (
                <Tab
                  id={`tag_${tag}`}
                  key={tag}
                  title={tag}
                  icon={<TagIcon tag={tag} />}
                />
              ))}
            </>
          )}
        </Tabs>
        <TabContent>
          <TabPanel id="recent">
            {showWelcome && (
              <div className={styles.welcome}>
                <div className={styles.welcomeHeader}>
                  <h2>Welcome to {__APP_NAME__}</h2>
                  <Button
                    onClick={() => setConfigValue('app.hideWelcome', true)}
                    icon={<BsXLg />}
                  >
                    Close
                  </Button>
                </div>
                <Social />
              </div>
            )}
            <ProjectList title="Recent" projects={['new', ...recent]} />
          </TabPanel>
          <TabPanel id="favorite">
            <ProjectList
              title="Favorite projects"
              searchable
              projects={favorite}
            />
          </TabPanel>
          <TabPanel id="all">
            <ProjectList title="All projects" searchable projects={all} />
          </TabPanel>
          {tags.map(tag => (
            <TabPanel id={`tag_${tag}`} key={tag}>
              <ProjectList
                title={tag}
                searchable
                projects={all.filter(project => project.tags?.includes(tag))}
              />
            </TabPanel>
          ))}
        </TabContent>
      </TabView>
    </div>
  );
});

export default Home;
