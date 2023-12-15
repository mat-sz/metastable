import {
  Download,
  InstanceInfo,
  Project,
  ProjectSettings,
  Requirement,
} from '@metastable/types';

export interface API {
  instance: {
    info(): Promise<InstanceInfo>;
    compatibility(): Promise<Requirement[]>;
  };
  projects: {
    all(): Promise<Project[]>;
    get(id: number): Promise<Project>;
    outputs(id: number): Promise<string[]>;
    create(data: Pick<Project, 'name' | 'settings'>): Promise<Project>;
    update(id: number, data: Partial<Omit<Project, 'id'>>): Promise<Project>;
  };
  downloads: {
    create(
      data: Pick<Download, 'filename' | 'url' | 'type'>,
    ): Promise<{ id: string; size: number } | { error: string }>;
    cancel(id: string): Promise<void>;
  };
  prompts: {
    create(
      projectId: number,
      settings: ProjectSettings,
    ): Promise<{ id: string }>;
  };
}
