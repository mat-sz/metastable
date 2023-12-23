import { makeAutoObservable, runInAction } from 'mobx';
import { TypeSocket } from 'typesocket';
import {
  ModelType,
  ComfyLogItem,
  ComfyStatus,
  AnyEvent,
  ComfyTorchInfo,
  Requirement,
  InstanceInfo,
  Project as APIProject,
} from '@metastable/types';

import { IS_ELECTRON, getStaticUrl, getUrl } from '../config';
import { ProjectStore } from './ProjectStore';
import { DownloadStore } from './DownloadStore';
import { API } from '../api';

declare global {
  // eslint-disable-next-line
  var _socket: TypeSocket<any> | undefined;
}

class MainStore {
  projects = new ProjectStore();
  downloads = new DownloadStore();
  connected = false;
  ready = false;
  private socket;
  info: InstanceInfo = {
    samplers: [],
    schedulers: [],
    models: {},
  };
  torchInfo?: ComfyTorchInfo = undefined;
  compatibility: Requirement[] = [];

  promptRemaining = 0;
  promptValue = 0;
  promptMax = 0;

  backendStatus: ComfyStatus = 'starting';
  backendLog: ComfyLogItem[] = [];

  constructor() {
    makeAutoObservable(this);

    if (IS_ELECTRON) {
      window.electronAPI.ready();
      window.electronAPI.onEvent((event: any) => this.onMessage(event));
      this.connected = true;
    } else {
      this.socket = new TypeSocket<AnyEvent>(getUrl('/ws', 'ws'), {
        maxRetries: 0,
        retryOnClose: true,
        retryTime: 1000,
      });

      // Make sure we don't have any lingering connections when the app reloads.
      window._socket?.disconnect();
      window._socket = this.socket;

      this.socket.on('connected', () => this.onConnected());
      this.socket.on('disconnected', () => this.onDisconnected());
      this.socket.on('message', message => this.onMessage(message));
      this.socket.connect();
    }

    this.init();
  }

  get project() {
    return this.projects.current;
  }

  async init() {
    this.refresh();

    const compatibility = await API.instance.compatibility();
    runInAction(() => {
      this.compatibility = compatibility;
    });
  }

  async refresh() {
    const data = await API.instance.info();
    runInAction(() => {
      this.info = data;
      this.ready = true;
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

  view(project_id: APIProject['id'], type: string, filename: string) {
    return getStaticUrl(`/projects/${project_id}/${type}/${filename}`);
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
        break;
      case 'prompt.end':
        for (const project of this.projects.projects) {
          if (project.id === message.data.project_id) {
            project.onPromptDone(message.data.output_filenames);
          }
        }
        break;
      case 'download.queue':
        this.downloads.remaining = message.data.queue_remaining;
        break;
      case 'download.state':
        this.downloads.updateDownload(message.data.id, {
          state: message.data.state,
          startedAt: message.data.startedAt,
        });
        this.refresh();
        break;
      case 'download.progress':
        this.downloads.updateDownload(message.data.id, {
          state: 'in_progress',
          progress: message.data.progress,
          startedAt: message.data.startedAt,
        });
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
      case 'ping':
        this.socket?.send({ event: 'ping', data: Date.now() });
        break;
      case 'info.torch':
        this.torchInfo = message.data;
        break;
    }
  }

  hasFile(type: ModelType, name: string) {
    if (this.info.models[type]?.find(file => file.name === name)) {
      return 'downloaded';
    }

    const item = this.downloads.queue.find(
      item =>
        item.name === name &&
        ['done', 'queued', 'in_progress'].includes(item.state),
    );

    if (item) {
      if (item.state === 'done') {
        return 'downloaded';
      } else {
        return 'queued';
      }
    }

    return undefined;
  }
}

export const mainStore = new MainStore();
