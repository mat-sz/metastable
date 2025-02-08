import { observer } from 'mobx-react-lite';
import React, { Suspense, useLayoutEffect } from 'react';

import { UIWrapper } from '$components/ui';
import { mainStore } from '$stores/MainStore';
import { setupStore } from '$stores/SetupStore';
import { uiStore } from '$stores/UIStore';
import { withoutTransitions } from '$utils/css';
import { lazyPreload } from '$utils/react';
import './index.scss';
import Home from './views/home';
import { Main } from './views/system/Main';

const Project = lazyPreload(() => import('./views/project'));
const Settings = lazyPreload(() => import('./views/settings'));
const Setup = lazyPreload(() => import('./views/setup'));
const ModelManager = lazyPreload(() => import('./views/models'));

const View: React.FC = observer(() => {
  if (setupStore?.status !== 'done') {
    return <Setup />;
  }

  mainStore.removeLoading();

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

export const App: React.FC = observer(() => {
  const theme = mainStore.theme;
  const fontSize = mainStore.config.data?.ui.fontSize || 16;

  useLayoutEffect(() => {
    withoutTransitions(() => {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.fontSize = `${fontSize}px`;
    });
  }, [theme, fontSize]);

  return (
    <UIWrapper>
      <Main>
        <Suspense fallback={<>Loading...</>}>
          <View />
        </Suspense>
      </Main>
    </UIWrapper>
  );
});
