import React, { useContext, useState } from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';

interface TabProps {
  id: string | number;
  title: string;
  icon?: JSX.Element;
}

export const Tab: React.FC<React.PropsWithChildren<TabProps>> = ({
  id,
  title,
  icon,
}) => {
  const context = useContext(TabsContext);

  return (
    <div
      className={clsx(styles.tab, {
        [styles.selected]: context.selected === id,
      })}
      onClick={() => context.select(id)}
      title={title}
    >
      {icon}
      <span>{title}</span>
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

interface TabsProps {
  buttonStyle?: 'normal' | 'icon';
}

export const Tabs: React.FC<React.PropsWithChildren<TabsProps>> = ({
  children,
  buttonStyle = 'normal',
}) => {
  return (
    <div className={clsx(styles.tabs, styles[buttonStyle])}>{children}</div>
  );
};

interface TabViewProps {
  defaultTab: string | number;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export const TabView: React.FC<React.PropsWithChildren<TabViewProps>> = ({
  defaultTab,
  children,
  direction = 'horizontal',
  className,
}) => {
  const [selectedTab, setSelectedTab] = useState(defaultTab);
  return (
    <div className={clsx(styles.tabView, styles[direction], className)}>
      <TabsContext.Provider
        value={{ selected: selectedTab, select: setSelectedTab }}
      >
        {children}
      </TabsContext.Provider>
    </div>
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
    return <>{children}</>;
  }

  return null;
};

interface TabContentProps {
  className?: string;
}

export const TabContent: React.FC<React.PropsWithChildren<TabContentProps>> = ({
  children,
  className,
}) => {
  return <div className={clsx(styles.content, className)}>{children}</div>;
};
