import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';

import { UIWrapper } from '$components/ui';
import { mainStore } from '$stores/MainStore';
import { setupStore } from '$stores/SetupStore';
import { uiStore } from '$stores/UIStore';
import { withoutTransitions } from '$utils/css';
import './index.scss';
import { Home } from './views/home';
import { ModelManager } from './views/models';
import { Project } from './views/project';
import { Settings } from './views/settings';
import { Setup } from './views/setup';
import { Main } from './views/system/Main';

const View: React.FC = observer(() => {
  useEffect(() => {
    withoutTransitions(() => {
      document.documentElement.setAttribute('data-theme', mainStore.theme);
    });
  }, [mainStore.theme]);

  if (setupStore?.status !== 'done') {
    return <Setup />;
  }

  switch (uiStore.view) {
    case 'project':
      return <Project />;
    case 'settings':
      return <Settings />;
    case 'models':
      return <ModelManager />;
    default:
      return <Home />;
  }
});

export const App: React.FC = () => {
  return (
    <UIWrapper>
      <Main>
        <View />
      </Main>
    </UIWrapper>
  );
};
