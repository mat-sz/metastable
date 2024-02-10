import React from 'react';

import type {
  BaseProject,
  SimpleProject,
  TrainingProject,
} from '@stores/project';

export const ProjectContext = React.createContext<BaseProject>(
  undefined as any,
);

export function useProject<T extends BaseProject>(): T {
  return React.useContext(ProjectContext) as T;
}

export const useSimpleProject = useProject<SimpleProject>;
export const useTraningProject = useProject<TrainingProject>;
