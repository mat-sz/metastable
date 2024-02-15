import {
  ConfigType,
  DownloadSettings,
  InstanceInfo,
  Project,
  ProjectInfo,
  ProjectSettings,
  ProjectTrainingSettings,
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
    inputs(id: Project['id']): Promise<string[]>;
    getInputMetadata(id: Project['id'], name: string): Promise<any>;
    setInputMetadata(
      id: Project['id'],
      name: string,
      metadata: any,
    ): Promise<void>;
    upload(id: Project['id'], file: File): Promise<string[]>;
    outputs(id: Project['id']): Promise<string[]>;
    create(data: ProjectInfo): Promise<Project>;
    update(
      id: Project['id'],
      data: Partial<ProjectInfo & { name: string; settings: string }>,
    ): Promise<Project>;
    train(id: Project['id'], settings: ProjectTrainingSettings): Promise<void>;
    stopTraining(id: Project['id']): Promise<void>;
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
