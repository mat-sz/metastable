import {
  AnyEvent,
  ComfyStatus,
  InstanceInfo,
  ModelType,
  TaskState,
} from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';
import { UnsavedProjects } from '$modals/unsavedProjects';
import { IS_ELECTRON } from '$utils/config';
import { ConfigStore } from './ConfigStore';
import { modalStore } from './ModalStore';
import { modelStore } from './ModelStore';
import { ProjectStore } from './ProjectStore';
import { SetupStore } from './SetupStore';
import { TaskStore } from './TaskStore';

class MainStore {
  projects = new ProjectStore();
  connected = false;
  info: InstanceInfo = {
    samplers: [],
    schedulers: [],
  };

  setup = new SetupStore();

  isMaximized = false;
  trainingQueue: { id: string }[] = [];

  backendStatus: ComfyStatus = 'starting';
  infoReady = false;
  view: string | undefined = 'home';

  tasks = new TaskStore();
  config = new ConfigStore();

  forceExit = false;

  constructor() {
    makeAutoObservable(this);

    if (IS_ELECTRON) {
      API.electron.window.onResize.subscribe(undefined, {
        onData: ({ isMaximized }) => {
          runInAction(() => {
            this.isMaximized = isMaximized;
          });
        },
      });
      this.connected = true;
    } else {
      window.wsOnOpen = () => {
        runInAction(() => {
          this.connected = true;
        });
      };
      window.wsOnClose = () => {
        runInAction(() => {
          this.connected = false;
        });
      };
    }

    API.instance.onEvent.subscribe(undefined, {
      onData: data => {
        this.onMessage(data as any);
      },
    });
    window.addEventListener('beforeunload', e => {
      if (this.forceExit) {
        return true;
      }

      if (!this.beforeUnload()) {
        e.preventDefault();
        return null;
      }

      return true;
    });

    this.init();
  }

  get ready() {
    return this.infoReady && this.setup.status;
  }

  get deviceName() {
    if (this.status === 'ready') {
      const device = this.info.torch?.device;

      if (device?.name) {
        return device.name;
      }

      if (device?.type) {
        return device.type;
      }
    }

    return '(Unknown)';
  }

  get project() {
    return this.projects.current;
  }

  beforeUnload() {
    if (this.projects.temporary.length) {
      modalStore.show(<UnsavedProjects />);
      return false;
    }

    return true;
  }

  exit(force = false) {
    this.forceExit = force;
    window.close();
  }

  async init() {
    await this.refresh();
    runInAction(() => {
      this.infoReady = true;
    });
  }

  async refresh() {
    const data = await API.instance.info.query();
    runInAction(() => {
      this.info = data;
    });
  }

  onConnected() {
    this.connected = true;
  }

  onDisconnected() {
    this.connected = false;
  }

  get status() {
    if (!this.connected) {
      return 'connecting';
    }

    return this.backendStatus;
  }

  onMessage(message: AnyEvent) {
    switch (message.event) {
      case 'training.end':
        this.trainingQueue = this.trainingQueue.filter(
          item => item.id !== message.data.projectId,
        );
        break;
      case 'backend.status':
        this.backendStatus = message.data;
        if (message.data === 'ready') {
          this.refresh();
        }
        break;
      case 'setup.status':
        this.setup.status = message.data;
        break;
      case 'task.create':
      case 'task.log':
      case 'task.update':
      case 'task.delete':
        this.tasks.onMessage(message);
        break;
    }
  }

  hasFile(type: ModelType, name: string) {
    if (modelStore.has(type, name)) {
      return 'downloaded';
    }

    const item = this.tasks.queues.downloads?.find(
      item =>
        item.data.name === name &&
        [
          TaskState.SUCCESS,
          TaskState.RUNNING,
          TaskState.QUEUED,
          TaskState.PREPARING,
        ].includes(item.state),
    );

    if (item) {
      if (item.state === TaskState.SUCCESS) {
        return 'downloaded';
      } else {
        return 'queued';
      }
    }

    return undefined;
  }

  get hasCheckpoint() {
    const model = modelStore.defaultModel(ModelType.CHECKPOINT);
    return !!model;
  }

  openModelManager() {
    this.view = 'models';
  }

  defaultModelName(type: ModelType) {
    const model = modelStore.defaultModel(type);
    return model?.file.name;
  }
}

export const mainStore = new MainStore();
