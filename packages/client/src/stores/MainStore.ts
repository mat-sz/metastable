import { makeAutoObservable, runInAction } from 'mobx';
import { TypeSocket } from 'typesocket';
import {
  ModelType,
  ComfyLogItem,
  ComfyStatus,
  AnyEvent,
  ComfyTorchInfo,
  FileInfo,
  Requirement,
} from '@metastable/types';

import { getUrl } from '../config';
import { ProjectStore } from './ProjectStore';
import { DownloadStore } from './DownloadStore';
import { httpGet } from '../http';

declare global {
  // eslint-disable-next-line
  var _socket: TypeSocket<any> | undefined;
}

interface Info {
  samplers: string[];
  schedulers: string[];
  models: Record<string, FileInfo[]>;
}

class MainStore {
  projects = new ProjectStore();
  downloads = new DownloadStore();
  connected = false;
  ready = false;
  private socket = new TypeSocket<AnyEvent>(getUrl('/ws', 'ws'), {
    maxRetries: 0,
    retryOnClose: true,
    retryTime: 1000,
  });
  info: Info = {
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

    // Make sure we don't have any lingering connections when the app reloads.
    window._socket?.disconnect();
    window._socket = this.socket;

    this.socket.on('connected', () => this.onConnected());
    this.socket.on('disconnected', () => this.onDisconnected());
    this.socket.on('message', message => this.onMessage(message));
    this.socket.connect();

    this.refresh();
  }

  get project() {
    return this.projects.current;
  }

  async refresh() {
    const data = await httpGet('/instance/info');
    runInAction(() => {
      this.info = data;
      this.ready = true;
    });

    const compatibility = await httpGet('/instance/compatibility');
    runInAction(() => {
      this.compatibility = compatibility;
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

  view(project_id: number, type: string, filename: string) {
    return getUrl(`/projects/${project_id}/${type}s/${filename}`);
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
        break;
      case 'backend.log':
        this.backendLog.push(message.data);
        break;
      case 'backend.logBuffer':
        this.backendLog.push(...message.data);
        break;
      case 'ping':
        this.socket.send({ event: 'ping', data: Date.now() });
        break;
      case 'info.torch':
        this.torchInfo = message.data;
        break;
    }
  }

  hasFile(type: ModelType, filename: string) {
    if (this.info.models[type]?.find(file => file.name === filename)) {
      return 'downloaded';
    }

    const item = this.downloads.queue.find(
      item =>
        item.filename === filename &&
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
