import React, { useContext, useState } from 'react';
import clsx from 'clsx';

import styles from './Tabs.module.scss';

interface TabProps {
  id: string | number;
  title: string;
}

export const Tab: React.FC<React.PropsWithChildren<TabProps>> = ({
  id,
  title,
}) => {
  const context = useContext(TabsContext);

  return (
    <div
      className={clsx(styles.tab, {
        [styles.selected]: context.selected === id,
      })}
      onClick={() => context.select(id)}
    >
      {title}
    </div>
  );
};

interface ITabsContext {
  selected: string | number;
  select(id: string | number): void;
}

const TabsContext = React.createContext<ITabsContext>({
  selected: '',
  select: () => {},
});

export const Tabs: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className={styles.tabs}>{children}</div>;
};

interface TabViewProps {
  defaultTab: string | number;
}

export const TabView: React.FC<React.PropsWithChildren<TabViewProps>> = ({
  defaultTab,
  children,
}) => {
  const [selectedTab, setSelectedTab] = useState(defaultTab);
  return (
    <TabsContext.Provider
      value={{ selected: selectedTab, select: setSelectedTab }}
    >
      {children}
    </TabsContext.Provider>
  );
};

interface TabPanelProps {
  id: string | number;
}

export const TabPanel: React.FC<React.PropsWithChildren<TabPanelProps>> = ({
  id,
  children,
}) => {
  const context = useContext(TabsContext);

  if (context.selected === id) {
    return <div className={styles.panel}>{children}</div>;
  }

  return null;
};
