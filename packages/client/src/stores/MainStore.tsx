import { joinFields } from '@metastable/common/field';
import {
  BackendStatus,
  InstanceInfo,
  LogItem,
  ModelType,
} from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API, linkManager } from '$api';
import { defaultHotkeys } from '$data/hotkeys';
import { parseHotkey } from '$hooks/useHotkey';
import { InstanceBackendError } from '$modals/instance/backendError';
import { ProjectUnsaved } from '$modals/project/unsaved';
import { fuzzy, strIncludes } from '$utils/fuzzy';
import { combineUnsubscribables } from '$utils/trpc';
import { ConfigStore } from './ConfigStore';
import { modalStore } from './ModalStore';
import { modelStore } from './ModelStore';
import { ProjectStore } from './ProjectStore';
import { setupStore } from './SetupStore';
import { TaskStore } from './TaskStore';
import { uiStore } from './UIStore';
import { updateStore } from './UpdateStore';

const MAX_LOG_ITEMS = 100;

class MainStore {
  projects = new ProjectStore();
  info!: InstanceInfo;
  backendLog: LogItem[] = [];
  modelCache: string[] = [];

  backendStatus: BackendStatus = 'starting';

  tasks = new TaskStore();
  config = new ConfigStore();

  connected = false;
  ready = false;
  forceExit = false;
  authorizationRequired = false;
  token: string | undefined = undefined;

  constructor() {
    makeAutoObservable(this);

    this.connected = linkManager.isConnected;
    linkManager.on('connectionStateChange', isConnected => {
      runInAction(() => {
        this.connected = isConnected;
      });
    });
    linkManager.tokenCallback = () => this.token;

    linkManager.subscribe(
      combineUnsubscribables(() => [
        API.instance.onBackendStatus.subscribe(undefined, {
          onData: status => {
            runInAction(() => {
              this.backendStatus = status;
            });

            switch (status) {
              case 'ready':
                break;
              case 'error':
                modalStore.show(<InstanceBackendError />);
                break;
            }
          },
        }),
        API.instance.onInfoUpdate.subscribe(undefined, {
          onData: () => {
            this.refresh();
            this.config.refresh();
          },
        }),
        API.instance.onBackendLog.subscribe(undefined, {
          onData: items => {
            runInAction(() => {
              this.backendLog.push(...items);
              this.backendLog = this.backendLog.slice(-1 * MAX_LOG_ITEMS);
            });
          },
        }),
        API.instance.onModelCacheChange.subscribe(undefined, {
          onData: () => {
            this.refreshModelCache();
          },
        }),
      ]),
    );

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

  get theme() {
    const theme = mainStore.config.data?.ui.theme || 'dark';
    if (theme !== 'system') {
      return theme;
    }

    return uiStore.systemTheme;
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
    return joinFields(
      this.info.features.filter(feature => feature.tags?.includes('simple')),
    );
  }

  get postprocessFields() {
    return joinFields(
      this.info.features.filter(feature =>
        feature.tags?.includes('postprocess'),
      ),
    );
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
      modalStore.show(
        <ProjectUnsaved
          projects={this.projects.draft}
          onClose={() => this.exit(true)}
        />,
      );
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
    try {
      await Promise.all([
        this.refresh(),
        this.config.refresh(),
        setupStore.init(),
      ]);
      runInAction(() => {
        this.ready = true;
      });
      await Promise.all([
        this.refreshModelCache(),
        updateStore.refresh(),
        this.projects.refresh(),
        this.tasks.refresh(),
        modelStore.refresh(),
      ]);
    } catch (e: any) {
      if (typeof e === 'object' && e.data?.code === 'UNAUTHORIZED') {
        runInAction(() => {
          this.authorizationRequired = true;
        });
      }
    }
  }

  removeLoading() {
    postMessage({ payload: 'removeLoading' }, '*');
  }

  get isConfigured() {
    return this.ready && setupStore.status === 'done';
  }

  async refresh() {
    const data = await API.instance.info.query();
    runInAction(() => {
      this.info = data;
    });
  }

  setToken(token: string) {
    this.authorizationRequired = false;
    this.ready = false;
    this.token = token;
    linkManager.reconnect();
    this.init();
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

  defaultModelMrn(type: ModelType) {
    const model = modelStore.defaultModel(type);
    return model?.mrn;
  }

  get searchFn() {
    return this.config.data?.ui?.fuzzySearch ? fuzzy : strIncludes;
  }

  async refreshModelCache() {
    const current = await API.instance.loadedModels.query();
    runInAction(() => {
      this.modelCache = current;
    });
  }
}

export const mainStore = new MainStore();
