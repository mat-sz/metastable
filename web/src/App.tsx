import React from 'react';

import './index.scss';
import { Project } from './views/project';
import { Header } from './views/system/Header';
import { Projects } from './views/system/Projects';
import { DownloadManager } from './views/download';

export const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <Projects />
      <Project />
      <DownloadManager />
    </div>
  );
};
