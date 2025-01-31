import { observer } from 'mobx-react-lite';
import React, { Suspense, useLayoutEffect } from 'react';

import { UIWrapper } from '$components/ui';
import { mainStore } from '$stores/MainStore';
import { setupStore } from '$stores/SetupStore';
import { uiStore } from '$stores/UIStore';
import { withoutTransitions } from '$utils/css';
import { lazyPreload } from '$utils/react';
import './index.scss';
import { Main } from './views/system/Main';

const Home = lazyPreload(() => import('./views/home'));
const Project = lazyPreload(() => import('./views/project'));
const Settings = lazyPreload(() => import('./views/settings'));
const Setup = lazyPreload(() => import('./views/setup'));
const ModelManager = lazyPreload(() => import('./views/models'));

const View: React.FC = observer(() => {
  useLayoutEffect(() => {
    withoutTransitions(() => {
      document.documentElement.setAttribute('data-theme', mainStore.theme);
    });
  }, [mainStore.theme]);
  useLayoutEffect(() => {
    withoutTransitions(() => {
      document.documentElement.style.fontSize = `${mainStore.config.data?.ui.fontSize || 16}px`;
    });
  }, [mainStore.config.data?.ui.fontSize]);

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
        <Suspense fallback={<></>}>
          <View />
        </Suspense>
      </Main>
    </UIWrapper>
  );
};
