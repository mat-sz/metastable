import React from 'react';
import { observer } from 'mobx-react-lite';

import './index.scss';
import { mainStore } from './stores/MainStore';
import { Project } from './views/project';
import { Header } from './views/system/Header';
import { Projects } from './views/system/Projects';
import { Welcome } from './views/system/Welcome';
import { Status } from './views/system/Status';
import { UI } from './components';
import { Setup } from './views/setup';

export const App: React.FC = observer(() => {
  if (!mainStore.ready) {
    return <div className="app">Loading...</div>;
  }

  if (mainStore.setup?.status?.status !== 'complete') {
    return (
      <UI>
        <div className="app">
          <Header showMenu={false} />
          <Setup />
        </div>
      </UI>
    );
  }

  return (
    <UI>
      <div className="app">
        <Header />
        {mainStore.projects.projects.length === 0 ? (
          <Welcome />
        ) : (
          <>
            <Projects />
            <Project />
          </>
        )}
        <Status />
      </div>
    </UI>
  );
});
