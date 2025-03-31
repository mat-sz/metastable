import { joinFields } from '@metastable/common/field';
import { InstanceInfo, ModelType } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API, linkManager } from '$api';
import { useUpdateStore } from '$store/update';
import { combineUnsubscribables } from '$utils/trpc';
import { modelStore } from './ModelStore';
import { ProjectStore } from './ProjectStore';
import { setupStore } from './SetupStore';
import { TaskStore } from './TaskStore';

class MainStore {
  projects = new ProjectStore();
  info!: InstanceInfo;

  tasks = new TaskStore();

  connected = false;
  ready = false;
  forceExit = false;
  redirect: { path: string; ifPathStartsWith?: string } | undefined = undefined;

  constructor() {
    makeAutoObservable(this);

    this.connected = linkManager.isConnected;
    linkManager.on('connectionStateChange', isConnected => {
      runInAction(() => {
        this.connected = isConnected;
      });
    });

    linkManager.subscribe(
      combineUnsubscribables(() => [
        API.instance.onInfoUpdate.subscribe(undefined, {
          onData: () => {
            this.refresh();
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

  redirectTo(path?: string, ifPathStartsWith?: string) {
    if (!path) {
      this.redirect = undefined;
      return;
    }

    this.redirect = { path, ifPathStartsWith };
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

  beforeUnload() {
    if (this.projects.draft.length) {
      this.projects.unsavedProjectsModalData = {
        projects: [...this.projects.draft],
        onClose: () => this.exit(true),
      };
      return false;
    }

    return true;
  }

  exit(force = false) {
    this.forceExit = force;
    window.close();
  }

  async init() {
    try {
      await Promise.all([this.refresh(), setupStore.init()]);
      runInAction(() => {
        this.ready = true;
      });
      await Promise.all([
        useUpdateStore.getState().refresh(),
        this.projects.refresh(),
        this.tasks.refresh(),
        modelStore.refresh(),
      ]);
    } catch {
      //
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

  defaultModelMrn(type: ModelType) {
    const model = modelStore.defaultModel(type);
    return model?.mrn;
  }
}

export const mainStore = new MainStore();
