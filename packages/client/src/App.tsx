import { observer } from 'mobx-react-lite';
import React from 'react';

import { UI } from '$components/ui';
import { mainStore } from '$stores/MainStore';
import './index.scss';
import { ModelManager } from './views/models';
import { Project } from './views/project';
import { Settings } from './views/settings';
import { Setup } from './views/setup';
import { Main } from './views/system/Main';
import { TabBar } from './views/system/TabBar';
import { Welcome } from './views/system/Welcome';

const View: React.FC = observer(() => {
  switch (mainStore.view) {
    case 'project':
      return <Project />;
    case 'settings':
      return <Settings />;
    case 'models':
      return <ModelManager />;
    default:
      return <Welcome />;
  }
});

export const App: React.FC = observer(() => {
  if (!mainStore.ready) {
    return <div className="app">Loading...</div>;
  }

  if (mainStore.setup?.status?.status !== 'done') {
    return (
      <UI>
        <Main>
          <Setup />
        </Main>
      </UI>
    );
  }

  return (
    <UI>
      <Main>
        <TabBar />
        <View />
      </Main>
    </UI>
  );
});
