import { makeAutoObservable } from 'mobx';
import { TypeSocket } from 'typesocket';
import { getUrl } from '../config';
import { ProjectStore } from './ProjectStore';

declare global {
  // eslint-disable-next-line
  var _socket: TypeSocket<any> | undefined;
}

enum MessageType {
  STATUS = 'status',
  PROGRESS = 'progress',
  EXECUTED = 'executed',
}

interface MessageModel {
  type: MessageType;
}

interface StatusMessageModel extends MessageModel {
  type: MessageType.STATUS;
  data: {
    queue_remaining: number;
    sid?: string;
  };
}

interface ProgressMessageModel extends MessageModel {
  type: MessageType.PROGRESS;
  data: {
    max: number;
    value: number;
  };
}

interface ExecutedMessageModel extends MessageModel {
  type: MessageType.EXECUTED;
  data: {
    prompt_id: string;
    output_filenames: string[];
    project_id: string;
  };
}

type Message = StatusMessageModel | ProgressMessageModel | ExecutedMessageModel;

interface Info {
  samplers: string[];
  schedulers: string[];
  checkpoints: string[];
  loras: string[];
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
    checkpoints: [],
    loras: [],
  };

  remaining = 0;
  progressValue = 0;
  progressMax = 0;

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
      case MessageType.STATUS:
        this.remaining = message.data.queue_remaining;
        break;
      case MessageType.PROGRESS:
        this.progressValue = message.data.value;
        this.progressMax = message.data.max;
        break;
      case MessageType.EXECUTED:
        for (const project of this.projects.projects) {
          if (project.id === message.data.project_id) {
            project.outputFilenames = message.data.output_filenames;
          }
        }
        break;
    }
  }
}

export const mainStore = new MainStore();
