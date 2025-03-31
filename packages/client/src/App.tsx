import { observer } from 'mobx-react-lite';
import React, { Suspense, useLayoutEffect } from 'react';
import { Route, Switch } from 'wouter';

import { ModalWrapperProvider } from '$hooks/useModal';
import { useConfigStore } from '$store/config';
import { useUIStore } from '$store/ui';
import { setupStore } from '$stores/SetupStore';
import { withoutTransitions } from '$utils/css';
import { lazyPreload } from '$utils/react';
import './index.scss';
import Home from './views/home';
import { Main } from './views/system/Main';

const Project = lazyPreload(() => import('./views/project'));
const Settings = lazyPreload(() => import('./views/settings'));
const Setup = lazyPreload(() => import('./views/setup'));
const ModelManager = lazyPreload(() => import('./views/models'));

export const App: React.FC = observer(() => {
  const config = useConfigStore(state => state.data);
  const systemTheme = useUIStore(state => state.systemTheme);
  const configTheme = config?.ui.theme || 'dark';
  const theme = configTheme === 'system' ? systemTheme : configTheme;
  const fontSize = config?.ui.fontSize || 16;
  const isSetup = setupStore?.status !== 'done';

  useLayoutEffect(() => {
    withoutTransitions(() => {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.fontSize = `${fontSize}px`;
    });
  }, [theme, fontSize]);

  return (
    <ModalWrapperProvider>
      <Main>
        <Suspense fallback={<>Loading...</>}>
          {isSetup ? (
            <Setup />
          ) : (
            <Switch>
              <Route path="/project/:id">
                <Project />
              </Route>
              <Route path="/settings">
                <Settings />
              </Route>
              <Route path="/models">
                <ModelManager />
              </Route>
              <Route path="/">
                <Home />
              </Route>
            </Switch>
          )}
        </Suspense>
      </Main>
    </ModalWrapperProvider>
  );
});
