import { makeAutoObservable, runInAction } from 'mobx';
import { TypeSocket } from 'typesocket';

import { getUrl } from '../config';
import { ProjectStore } from './ProjectStore';
import {
  BackendLogMessageModel,
  BackendStatus,
  Message,
} from '../types/websocket';
import { DownloadStore } from './DownloadStore';
import { ModelType } from '../types/model';
import { httpGet } from '../http';

declare global {
  // eslint-disable-next-line
  var _socket: TypeSocket<any> | undefined;
}

interface Info {
  samplers: string[];
  schedulers: string[];
  models: Record<string, { name: string; size: number }[]>;
}

class MainStore {
  projects = new ProjectStore();
  downloads = new DownloadStore();
  connected = false;
  ready = false;
  private socket = new TypeSocket<Message>(getUrl('/ws', 'ws'), {
    maxRetries: 0,
    retryOnClose: true,
    retryTime: 1000,
  });
  info: Info = {
    samplers: [],
    schedulers: [],
    models: {},
  };
  modal: 'new_project' | 'open_project' | 'models' | 'backend' | undefined =
    undefined;

  promptRemaining = 0;
  promptValue = 0;
  promptMax = 0;

  backendStatus: BackendStatus = 'starting';
  backendLog: BackendLogMessageModel['data'][] = [];

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
    const data = await httpGet('/info');
    runInAction(() => {
      this.info = data;
      this.ready = true;
    });
  }

  onConnected() {
    this.connected = true;
  }

  onDisconnected() {
    this.connected = false;
  }

  view(project_id: number, type: string, filename: string) {
    return getUrl(`/projects/${project_id}/${type}s/${filename}`);
  }

  onMessage(message: Message) {
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
      case 'download.start':
        this.downloads.updateDownload(message.data.id, {
          state: 'in_progress',
        });
        break;
      case 'download.progress':
        this.downloads.updateDownload(message.data.id, {
          state: 'in_progress',
          progress: message.data.progress,
          size: message.data.size,
          started_at: message.data.started_at,
        });
        break;
      case 'download.end':
        this.downloads.updateDownload(message.data.id, {
          state: 'done',
        });
        this.refresh();
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
