import { mapProjectFields } from '@metastable/common';
import {
  BackendStatus,
  InstanceInfo,
  LogItem,
  ModelType,
} from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { defaultHotkeys } from '$/data/hotkeys';
import { API } from '$api';
import { parseHotkey } from '$hooks/useHotkey';
import { BackendError } from '$modals/backendError';
import { UnsavedProjects } from '$modals/unsavedProjects';
import { IS_ELECTRON } from '$utils/config';
import { fuzzy, strIncludes } from '$utils/fuzzy';
import { ConfigStore } from './ConfigStore';
import { modalStore } from './ModalStore';
import { modelStore } from './ModelStore';
import { ProjectStore } from './ProjectStore';
import { setupStore } from './SetupStore';
import { TaskStore } from './TaskStore';
import { uiStore } from './UIStore';
import { updateStore } from './UpdateStore';

class MainStore {
  projects = new ProjectStore();
  connected = false;
  info: InstanceInfo = {
    samplers: [],
    schedulers: [],
    vram: 0,
    dataRoot: '/',
    features: [],
  };
  backendLog: LogItem[] = [];

  trainingQueue: { id: string }[] = [];

  backendStatus: BackendStatus = 'starting';
  infoReady = false;

  tasks = new TaskStore();
  config = new ConfigStore();

  forceExit = false;

  constructor() {
    makeAutoObservable(this);

    if (IS_ELECTRON) {
      this.connected = true;
    } else {
      this.connected = window.wsIsOpen;
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

    API.instance.onBackendStatus.subscribe(undefined, {
      onData: status => {
        runInAction(() => {
          this.backendStatus = status;
        });

        switch (status) {
          case 'ready':
            this.refresh();
            break;
          case 'error':
            modalStore.show(<BackendError />);
            break;
        }
      },
    });
    API.instance.onBackendLog.subscribe(undefined, {
      onData: items => {
        runInAction(() => {
          this.backendLog.push(...items);
        });
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
    return this.infoReady && setupStore.status;
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

  get projectFields() {
    return mapProjectFields(this.info.features);
  }

  get hotkeys() {
    const overrides = this.config.data?.app?.hotkeys;
    const hotkeys = { ...defaultHotkeys };

    if (overrides) {
      for (const [key, value] of Object.entries(overrides)) {
        if (value && key in hotkeys) {
          hotkeys[key] = value;
        }
      }
    }

    return Object.fromEntries(
      Object.entries(hotkeys).map(([id, keys]) => [id, parseHotkey(keys)]),
    );
  }

  beforeUnload() {
    if (this.projects.draft.length) {
      modalStore.show(<UnsavedProjects />);
      return false;
    }

    return true;
  }

  notify(title: string, body: string, onClick?: () => void) {
    if (
      Notification.permission !== 'granted' ||
      !this.config.data?.ui?.notifications
    ) {
      return;
    }

    if (uiStore.focused) {
      return;
    }

    const notification = new Notification(title, { body });
    if (onClick) {
      notification.addEventListener('click', onClick);
    }
  }

  exit(force = false) {
    this.forceExit = force;
    window.close();
  }

  async init() {
    updateStore.refresh();
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

  get hasCheckpoint() {
    const model = modelStore.defaultModel(ModelType.CHECKPOINT);
    return !!model;
  }

  get enabledFeatures() {
    const featureIds: string[] = [];
    for (const feature of this.info.features) {
      featureIds.push(feature.id);
    }
    return featureIds;
  }

  defaultModelName(type: ModelType) {
    const model = modelStore.defaultModel(type);
    return model?.file.name;
  }

  get searchFn() {
    return this.config.data?.ui?.fuzzySearch ? fuzzy : strIncludes;
  }
}

export const mainStore = new MainStore();
