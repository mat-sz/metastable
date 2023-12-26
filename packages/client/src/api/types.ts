import {
  InstanceInfo,
  Project,
  ProjectSettings,
  SetupDetails,
  SetupSettings,
  SetupStatus,
} from '@metastable/types';

export interface API {
  instance: {
    info(): Promise<InstanceInfo>;
  };
  setup: {
    status(): Promise<SetupStatus>;
    details(): Promise<SetupDetails>;
    start(settings: SetupSettings): Promise<void>;
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
