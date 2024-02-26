import { makeAutoObservable, runInAction } from 'mobx';
import {
  ModelType,
  ComfyLogItem,
  ComfyStatus,
  AnyEvent,
  ComfyTorchInfo,
  InstanceInfo,
  Project as APIProject,
  TaskState,
  UtilizationEvent,
} from '@metastable/types';

import { API } from '@api';
import { getStaticUrl } from '@utils/url';
import { ProjectStore } from './ProjectStore';
import { SetupStore } from './SetupStore';
import { TaskStore } from './TaskStore';
import { ConfigStore } from './ConfigStore';

class MainStore {
  projects = new ProjectStore();
  connected = false;
  info: InstanceInfo = {
    samplers: [],
    schedulers: [],
    models: {},
  };
  torchInfo?: ComfyTorchInfo = undefined;

  setup = new SetupStore();

  isMaximized = false;
  promptRemaining = 0;
  promptValue = 0;
  promptMax = 0;
  promptQueue: { id: string; projectId: string; value: number; max: number }[] =
    [];
  trainingQueue: { id: string }[] = [];

  backendStatus: ComfyStatus = 'starting';
  backendLog: ComfyLogItem[] = [];
  infoReady = false;
  utilization: UtilizationEvent['data'] = {
    cpuUsage: 0,
    hddTotal: 0,
    hddUsed: 0,
    ramTotal: 0,
    ramUsed: 0,
  };

  tasks = new TaskStore();
  config = new ConfigStore();

  constructor() {
    makeAutoObservable(this);

    // if (IS_ELECTRON) {
    //   window.electronAPI.ready();
    //   window.electronAPI.onEvent((event: any) => this.onMessage(event));
    //   window.electronWindow.onMaximized((isMaximized: boolean) =>
    //     runInAction(() => (this.isMaximized = isMaximized)),
    //   );
    //   this.connected = true;
    // }
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
    API.instance.onEvent.subscribe(undefined, {
      onData: data => {
        this.onMessage(data as any);
      },
    });

    this.init();
  }

  get ready() {
    return this.infoReady && this.setup.status;
  }

  get deviceName() {
    if (this.status === 'ready') {
      const device = this.torchInfo?.device;

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

    const dataDir = (data as any).dataDir;
    if (dataDir) {
      window.dataDir = dataDir;
    }
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

  view(projectId: APIProject['id'], type: string, filename: string) {
    return getStaticUrl(`/projects/${projectId}/${type}/${filename}`);
  }

  thumb(projectId: APIProject['id'], type: string, filename: string) {
    const split = filename.split('.');
    if (split.length > 1) {
      split.pop();
      split.push('thumb', 'jpg');
    }
    return getStaticUrl(
      `/projects/${projectId}/${type}/.metastable/${split.join('.')}`,
    );
  }

  pushLog(item: ComfyLogItem) {
    if (
      this.backendLog.find(
        logItem =>
          logItem.timestamp === item.timestamp && logItem.text === item.text,
      )
    ) {
      return;
    }

    this.backendLog.push(item);
  }

  onMessage(message: AnyEvent) {
    switch (message.event) {
      case 'prompt.start':
        this.promptValue = 0;
        this.promptMax = 0;
        break;
      case 'prompt.queue':
        this.promptRemaining = message.data.queue_remaining;
        break;
      case 'prompt.progress':
        this.promptValue = message.data.value;
        this.promptMax = message.data.max;
        const prompt = this.promptQueue.find(
          prompt => prompt.id === message.data.id,
        );
        if (prompt) {
          prompt.value = message.data.value;
          prompt.max = message.data.max;
        }
        break;
      case 'prompt.end':
        this.promptQueue = this.promptQueue.filter(
          prompt => prompt.id !== message.data.id,
        );
        for (const project of this.projects.projects) {
          if (project.id === message.data.project_id) {
            project.onPromptDone(message.data.output_filenames);
          }
        }
        break;
      case 'training.end':
        this.trainingQueue = this.trainingQueue.filter(
          item => item.id !== message.data.projectId,
        );
        break;
      case 'prompt.error':
        this.promptQueue = this.promptQueue.filter(
          prompt => prompt.id !== message.data.id,
        );
        break;
      case 'models.changed':
        this.refresh();
        break;
      case 'backend.status':
        this.backendStatus = message.data;
        if (message.data === 'ready') {
          this.refresh();
        }
        break;
      case 'backend.log':
        this.pushLog(message.data);
        break;
      case 'backend.logBuffer':
        for (const item of message.data) {
          this.pushLog(item);
        }
        break;
      case 'info.torch':
        this.torchInfo = message.data;
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
      case 'utilization':
        this.utilization = message.data;
        break;
    }
  }

  hasFile(type: string, name: string) {
    if (this.info.models[type]?.find(({ file }) => file.name === name)) {
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
    return this.info.models[ModelType.CHECKPOINT]?.[0];
  }

  defaultModelName(type: ModelType) {
    return this.info.models[type]?.[0]?.file.name;
  }
}

export const mainStore = new MainStore();
