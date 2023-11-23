import React from 'react';
import { observer } from 'mobx-react-lite';

import './index.scss';
import { mainStore } from './stores/MainStore';
import { Project } from './views/project';
import { Header } from './views/system/Header';
import { Projects } from './views/system/Projects';
import { DownloadManager } from './views/download';
import { Welcome } from './views/system/Welcome';
import { NewProject } from './views/projects/NewProject';

export const App: React.FC = observer(() => {
  if (!mainStore.ready) {
    return <div className="app">Loading...</div>;
  }

  return (
    <div className="app">
      <Header />
      {mainStore.projects.projects.length === 0 ? (
        <Welcome />
      ) : (
        <>
          <Projects /> <Project />
        </>
      )}
      <DownloadManager />
      <NewProject />
    </div>
  );
});
