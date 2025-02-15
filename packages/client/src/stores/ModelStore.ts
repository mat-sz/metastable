import { MRN } from '@metastable/common/mrn';
import { Model, ModelType } from '@metastable/types';
import { makeAutoObservable, runInAction } from 'mobx';

import { API, linkManager } from '$api';
import { ModelTreeItem, ModelTreeNode } from '$types/model';
import { combineUnsubscribables } from '$utils/trpc';

class ModelStore {
  models: Record<string, Model[]> = {};
  isLoading = false;

  constructor() {
    makeAutoObservable(this);

    linkManager.subscribe(
      combineUnsubscribables(() => [
        API.model.onChange.subscribe(undefined, {
          onData: () => {
            this.refresh();
          },
        }),
      ]),
    );
  }

  get treeNodes() {
    const nodes: Record<string, ModelTreeNode[]> = {};

    for (const [type, models] of Object.entries(this.models)) {
      const modelNodes = models.map(model => ({
        ...model,
        nodeType: 'item',
        parentId: model.file.parts?.length
          ? model.file.parts.join('/')
          : undefined,
      })) as ModelTreeItem[];
      nodes[type] = [...modelNodes];

      const groupSet = new Set<string>();
      for (const node of modelNodes) {
        const parts = node.file.parts;
        if (!parts?.length) {
          continue;
        }

        for (let i = 0; i < parts.length; i++) {
          groupSet.add(parts.slice(0, i + 1).join('/'));
        }
      }

      for (const path of groupSet) {
        const split = path.split('/');
        const name = split.pop()!;

        nodes[type].push({
          id: path,
          nodeType: 'group',
          name,
          parentId: split.length ? split.join('/') : undefined,
        });
      }
    }

    return nodes;
  }

  async refresh(resetCache = false) {
    this.isLoading = true;
    if (resetCache) {
      await API.model.resetCache.mutate();
    }
    const data = await API.model.all.query();
    runInAction(() => {
      this.models = data;
      this.isLoading = false;
    });
  }

  get types(): ModelType[] {
    return Object.entries(this.models)
      .filter(entry => entry[1].length > 0)
      .map(entry => entry[0]) as ModelType[];
  }

  findByName(type: ModelType, name?: string) {
    if (!name) {
      return undefined;
    }

    return this.models[type]?.find(({ file }) => file.name === name);
  }

  hasByName(type: ModelType, name: string) {
    return !!this.findByName(type, name);
  }

  findByPath(path: string) {
    for (const type of Object.values(ModelType)) {
      const model = this.models[type]?.find(({ file }) => file.path == path);
      if (model) {
        return model;
      }
    }
  }

  find(mrn?: string) {
    if (!mrn) {
      return undefined;
    }

    const parsed = MRN.parse(mrn);
    if (parsed.segments[0] !== 'model') {
      return undefined;
    }

    const type = parsed.segments[1] as ModelType;
    if (!Object.values(ModelType).includes(type)) {
      return undefined;
    }

    return this.models[type]?.find(model => model.mrn === mrn);
  }

  has(mrn?: string) {
    return !!this.find(mrn);
  }

  size(mrn?: string) {
    if (!mrn) {
      return 0;
    }

    const model = this.find(mrn);
    return model?.file.size ?? 0;
  }

  type(type: ModelType) {
    return this.models[type] || [];
  }

  defaultModel(type: ModelType) {
    return this.models[type]?.[0];
  }
}

export const modelStore = new ModelStore();
