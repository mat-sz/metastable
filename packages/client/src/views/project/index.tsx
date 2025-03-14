import { ProjectType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import { useRoute } from 'wouter';

import { useHotkey } from '$hooks/useHotkey';
import { useModalCondition } from '$hooks/useModal';
import { ProjectDraft } from '$modals/project/draft';
import { mainStore } from '$stores/MainStore';
import { ProjectContext } from './context';
import { SimpleProjectView } from './simple';
import { TrainingProjectView } from './training';

export const Project: React.FC = observer(() => {
  const params = useRoute('/project/:id')[1];
  const project = mainStore.projects.find(params?.id);
  const showDraftModal = !!project?.showDraftModal;
  useModalCondition(<ProjectDraft project={project!} />, () => showDraftModal, [
    showDraftModal,
  ]);

  const close = useCallback(() => project?.close(), [project]);
  const forceClose = useCallback(() => project?.close(true), [project]);

  useHotkey('projects_close', close);
  useHotkey('projects_forceClose', forceClose);

  if (!project) {
    return null;
  }

  return (
    <ProjectContext.Provider value={project}>
      {project.type === ProjectType.SIMPLE && <SimpleProjectView />}
      {project.type === ProjectType.TRAINING && <TrainingProjectView />}
    </ProjectContext.Provider>
  );
});

export default Project;
