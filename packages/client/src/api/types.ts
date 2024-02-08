import {
  ConfigType,
  DownloadSettings,
  InstanceInfo,
  Project,
  ProjectSettings,
  SetupDetails,
  SetupSettings,
  SetupStatus,
  Task,
} from '@metastable/types';

export interface API {
  instance: {
    info(): Promise<InstanceInfo>;
    restart(): Promise<void>;
  };
  config: {
    all(): Promise<ConfigType>;
    store(value: ConfigType): Promise<ConfigType>;
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
    create(data: DownloadSettings): Promise<void>;
  };
  prompts: {
    create(
      projectId: Project['id'],
      settings: ProjectSettings,
    ): Promise<{ id: string }>;
  };
  tasks: {
    all(): Promise<Record<string, Task<any>[]>>;
    queue(queueId: string): Promise<Task<any>[]>;
    cancel(queueId: string, taskId: string): Promise<void>;
    dismiss(queueId: string, taskId: string): Promise<void>;
  };
}
