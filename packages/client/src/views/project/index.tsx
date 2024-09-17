import { observer } from 'mobx-react-lite';
import React from 'react';

import { mainStore } from '$stores/MainStore';
import { ProjectContext } from './context';
import { SimpleProjectView } from './simple';
import { TrainingProjectView } from './training';

export const Project: React.FC = observer(() => {
  const project = mainStore.project;

  if (!project) {
    return null;
  }

  return (
    <ProjectContext.Provider value={project}>
      {project.type === 'simple' && <SimpleProjectView />}
      {project.type === 'training' && <TrainingProjectView />}
    </ProjectContext.Provider>
  );
});
