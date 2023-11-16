import { makeAutoObservable } from 'mobx';
import { TypeSocket } from 'typesocket';

import { getUrl } from '../config';
import { ProjectStore } from './ProjectStore';
import { Message } from '../types/websocket';

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

  downloadRemaining = 0;
  downloadValue = 0;
  downloadMax = 0;

  constructor() {
    makeAutoObservable(this);

    // Make sure we don't have any lingering connections when the app reloads.
    window._socket?.disconnect();
    window._socket = this.socket;

    this.socket.on('connected', () => this.onConnected());
    this.socket.on('disconnected', () => this.onDisconnected());
    this.socket.on('message', message => this.onMessage(message));
    this.socket.connect();

    this.init();
  }

  get project() {
    return this.projects.current;
  }

  async init() {
    const res = await fetch(getUrl('/info'));
    this.info = await res.json();
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
        this.downloadRemaining = message.data.queue_remaining;
        break;
      case 'download.progress':
        this.downloadValue = message.data.value;
        this.downloadMax = message.data.max;
        break;
    }
  }

  async download(type: string, url: string, filename: string) {
    await fetch(getUrl('/download'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, url, filename }),
    });
  }
}

export const mainStore = new MainStore();
