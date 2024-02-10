import React from 'react';
import { BaseProject } from '../../stores/project/base';
import { SimpleProject } from '../../stores/project/simple';

export const ProjectContext = React.createContext<BaseProject>(
  undefined as any,
);

export function useProject<T extends BaseProject>(): T {
  return React.useContext(ProjectContext) as T;
}

export const useSimpleProject = useProject<SimpleProject>;
