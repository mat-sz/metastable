import { makeAutoObservable, runInAction } from 'mobx';
import { TypeSocket } from 'typesocket';

import { getUrl } from '../config';
import { ProjectStore } from './ProjectStore';
import { Message } from '../types/websocket';
import { DownloadStore } from './DownloadStore';
import { ModelType } from '../types/model';

declare global {
  // eslint-disable-next-line
  var _socket: TypeSocket<any> | undefined;
}

interface Info {
  samplers: string[];
  schedulers: string[];
  models: {
    checkpoints: string[];
    clip: string[];
    clip_vision: string[];
    controlnet: string[];
    diffusers: string[];
    embeddings: string[];
    gligen: string[];
    hypernetworks: string[];
    loras: string[];
    style_models: string[];
    upscale_models: string[];
    vae: string[];
    vae_approx: string[];
  };
}

class MainStore {
  projects = new ProjectStore();
  downloads = new DownloadStore();
  connected = false;
  private socket = new TypeSocket<Message>(getUrl('/ws', 'ws'), {
    maxRetries: 0,
    retryOnClose: true,
    retryTime: 1000,
  });
  info: Info = {
    samplers: [],
    schedulers: [],
    models: {
      checkpoints: [],
      clip: [],
      clip_vision: [],
      controlnet: [],
      diffusers: [],
      embeddings: [],
      gligen: [],
      hypernetworks: [],
      loras: [],
      style_models: [],
      upscale_models: [],
      vae: [],
      vae_approx: [],
    },
  };

  promptRemaining = 0;
  promptValue = 0;
  promptMax = 0;

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
    const res = await fetch(getUrl('/info'));
    const data = await res.json();
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

  onMessage(message: Message) {
    switch (message.type) {
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
            project.outputFilenames = message.data.output_filenames;
          }
        }
        break;
      case 'download.queue':
        this.downloads.remaining = message.data.queue_remaining;
        break;
      case 'download.start':
        this.downloads.updateDownload(message.data.download_id, {
          state: 'in_progress',
        });
        break;
      case 'download.progress':
        this.downloads.updateDownload(message.data.download_id, {
          state: 'in_progress',
          progress: message.data.progress,
          size: message.data.size,
          started_at: message.data.started_at,
        });
        break;
      case 'download.end':
        this.downloads.updateDownload(message.data.download_id, {
          state: 'done',
        });
        this.refresh();
        break;
      case 'models.changed':
        this.refresh();
        break;
    }
  }

  hasFile(type: ModelType, filename: string) {
    if (this.info.models[type].includes(filename)) {
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
