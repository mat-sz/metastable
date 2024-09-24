import {
  BackendStatus,
  InstanceInfo,
  ModelType,
  UpdateInfo,
} from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API } from '$api';
import { BackendError } from '$modals/backendError';
import { UnsavedProjects } from '$modals/unsavedProjects';
import { UpdateAvailable } from '$modals/updateAvailable';
import { IS_ELECTRON } from '$utils/config';
import { fuzzy, strIncludes } from '$utils/fuzzy';
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
    vram: 0,
    dataRoot: '/',
  };
  updateInfo: UpdateInfo = {
    canCheckForUpdate: false,
    isAutoUpdateAvailable: false,
  };

  setup = new SetupStore();

  isFocused = false;
  isMaximized = false;
  isFullScreen = false;
  trainingQueue: { id: string }[] = [];

  notificationPermission = Notification.permission;

  backendStatus: BackendStatus = 'starting';
  infoReady = false;
  updateInfoReady = false;
  view: string | undefined = 'home';

  tasks = new TaskStore();
  config = new ConfigStore();

  forceExit = false;

  constructor() {
    makeAutoObservable(this);

    if (IS_ELECTRON) {
      API.electron.window.onResize.subscribe(undefined, {
        onData: ({ isMaximized, isFullScreen }) => {
          runInAction(() => {
            this.isMaximized = isMaximized;
            this.isFullScreen = isFullScreen;
          });
        },
      });
      API.electron.window.onFocusChange.subscribe(undefined, {
        onData: ({ isFocused }) => {
          runInAction(() => {
            this.isFocused = isFocused;
          });
        },
      });
      API.electron.autoUpdater.onUpdateDownloaded.subscribe(undefined, {
        onData: ({ updateDownloaded, version }) => {
          if (updateDownloaded) {
            modalStore.show(<UpdateAvailable version={version!} />);
          }
        },
      });
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
        this.backendStatus = status;

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

  get focused() {
    if (IS_ELECTRON) {
      return this.isFocused;
    }

    return document.visibilityState === 'visible';
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

  async checkNotificationPermission() {
    try {
      await Notification.requestPermission();
    } catch {
      //
    }

    runInAction(() => {
      this.notificationPermission = Notification.permission;
    });
  }

  notify(title: string, body: string, onClick?: () => void) {
    if (
      Notification.permission !== 'granted' ||
      !this.config.data?.ui?.notifications
    ) {
      return;
    }

    if (this.focused) {
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
    this.checkForUpdates();
    await this.refresh();
    runInAction(() => {
      this.infoReady = true;
    });
  }

  async checkForUpdates() {
    runInAction(() => {
      this.updateInfoReady = false;
    });
    const data = await API.instance.updateInfo.query();
    runInAction(() => {
      this.updateInfo = data;
      this.updateInfoReady = true;
    });
  }

  async resetBundle() {
    this.setup.status = 'required';
    await API.instance.resetBundle.mutate();
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

  openModelManager() {
    this.view = 'models';
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
