import React from 'react';

import './index.scss';
import { Status } from './views/system/Status';
import { Project } from './views/project';
import { Header } from './views/system/Header';
import { Projects } from './views/system/Projects';

export const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <Projects />
      <Project />
      <Status />
    </div>
  );
};