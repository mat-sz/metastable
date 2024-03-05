import React from 'react';
import { observer } from 'mobx-react-lite';

import { UI } from '$components/ui';
import { mainStore } from '$stores/MainStore';
import './index.scss';
import { Project } from './views/project';
import { Projects } from './views/system/Projects';
import { Welcome } from './views/system/Welcome';
import { Setup } from './views/setup';
import { Main } from './views/system/Main';

export const App: React.FC = observer(() => {
  if (!mainStore.ready) {
    return <div className="app">Loading...</div>;
  }

  if (mainStore.setup?.status?.status !== 'done') {
    return (
      <UI>
        <Main showMenu={false}>
          <Setup />
        </Main>
      </UI>
    );
  }

  return (
    <UI>
      <Main>
        {mainStore.projects.projects.length === 0 ? (
          <Welcome />
        ) : (
          <>
            <Projects />
            <Project />
          </>
        )}
      </Main>
    </UI>
  );
});
