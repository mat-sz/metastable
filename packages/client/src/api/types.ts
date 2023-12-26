import {
  InstanceInfo,
  Project,
  ProjectSettings,
  Requirement,
} from '@metastable/types';

export interface API {
  instance: {
    info(): Promise<InstanceInfo>;
  };
  setup: {
    info(): Promise<any>;
    details(): Promise<any>;
  };
  projects: {
    all(): Promise<Project[]>;
    get(id: Project['id']): Promise<Project>;
    outputs(id: Project['id']): Promise<string[]>;
    create(data: Pick<Project, 'name' | 'settings'>): Promise<Project>;
    update(
      id: Project['id'],
      data: Partial<Omit<Project, 'id'>>,
    ): Promise<Project>;
  };
  downloads: {
    create(data: {
      name: string;
      type: string;
      url: string;
    }): Promise<{ id: string; size: number; name: string } | { error: string }>;
    cancel(id: string): Promise<void>;
  };
  prompts: {
    create(
      projectId: Project['id'],
      settings: ProjectSettings,
    ): Promise<{ id: string }>;
  };
}
