import fs from 'fs/promises';

import {
  joinFields,
  MRN,
  recurseFields,
  setDefaultValues,
} from '@metastable/common';
import {
  BaseSettings,
  Feature,
  FieldType,
  ModelType,
  ProjectTaskData,
  TaskState,
} from '@metastable/types';

import { Metastable } from '#metastable';
import { ProjectEntity } from '../../data/project.js';
import { BaseTask } from '../../tasks/task.js';
import { RPCSession } from '../rpc/session.js';
import { CachedModelInfo } from '../rpc/types.js';

type TaskHandlers = { [key: string]: (...args: any[]) => Promise<void> | void };

export type BaseComfyTaskHandlers = {
  load: () => Promise<void> | void;
};

export class BaseComfyTask<
  THandlers extends TaskHandlers = any,
  TSettings extends BaseSettings = BaseSettings,
> extends BaseTask<ProjectTaskData> {
  public session?: RPCSession;
  private features: Feature[] = [];
  public cachedModels: CachedModelInfo[] = [];

  constructor(
    name: string,
    public project: ProjectEntity,
    public settings: TSettings,
  ) {
    super(name, { projectId: project.id });
    this.created();
  }

  private _taskHandlers: {
    [key in keyof THandlers]?: Set<THandlers[key]>;
  } = {};

  after<TKey extends keyof THandlers>(
    eventName: TKey,
    listener: THandlers[TKey],
  ) {
    if (!this._taskHandlers[eventName]) {
      this._taskHandlers[eventName] = new Set();
    }

    this._taskHandlers[eventName]?.add(listener);
  }

  protected async executeHandlers<TKey extends keyof THandlers>(
    eventName: TKey,
    ...args: Parameters<THandlers[TKey]>
  ) {
    const callbacks = [...(this._taskHandlers[eventName]?.values() || [])];
    for (const callback of callbacks) {
      await callback.apply(this, args);
    }
  }

  protected async validateModel(
    type: ModelType,
    required: boolean,
    mrn?: string,
  ) {
    if (!mrn) {
      if (required) {
        throw new Error(`Missing ${type} model.`);
      } else {
        return false;
      }
    }

    const parsed = MRN.parse(mrn);
    if (parsed.segments[0] !== 'model') {
      throw new Error(`Invalid MRN for model type ${type}: ${mrn}`);
    }

    const path = await Metastable.instance.resolve(mrn);
    return !!path;
  }

  async init() {
    this.features = await Metastable.instance.feature.all();
    const fields = joinFields(this.features);
    setDefaultValues(this.settings.featureData, fields);

    for (const feature of this.features) {
      if (!feature.enabled) {
        continue;
      }

      const instance = Metastable.instance.feature.features[feature.id];
      await instance?.onTask?.(this);
    }

    const settings = this.settings;

    const promises: Promise<void>[] = [];

    recurseFields(settings.featureData, fields, (parent, key, field) => {
      if (field.type === FieldType.MODEL) {
        const fn = async () => {
          try {
            const mrn = parent?.[key];
            await this.validateModel(field.modelType, true, mrn);
            this.cachedModels.push({
              path: await Metastable.instance.resolve(mrn),
            });
          } catch {
            parent.enabled = false;
          }
        };

        promises.push(fn());
      }
    });

    await Promise.all(promises);
    await (this as any).executeHandlers('load');

    return { projectId: this.project.id };
  }

  private stepStart: number | undefined;
  private stepName: string | undefined;

  public step(name: string, max?: number) {
    const stepTime = { ...this.data.stepTime };
    if (this.stepStart && this.stepName) {
      stepTime[this.stepName] = Date.now() - this.stepStart;
    }
    this.stepStart = Date.now();
    this.stepName = name;

    this.data = {
      ...this.data,
      step: name,
      stepValue: 0,
      stepMax: max,
      preview: undefined,
      stepTime,
    };
  }

  cancel() {
    if (this.state === TaskState.RUNNING && this.session) {
      this.session.destroy();
    }

    this.state = TaskState.CANCELLING;
  }

  async inputAsBuffer(url: string | Buffer): Promise<Buffer> {
    if (url instanceof Buffer) {
      return url;
    } else if (typeof url === 'string') {
      if (url.startsWith('data:')) {
        return Buffer.from(url.split(',')[1], 'base64');
      }

      if (url.startsWith('mrn:')) {
        return await fs.readFile(await Metastable.instance.resolve(url));
      }
    }

    throw new Error('Unable to load input');
  }

  async loadInputRaw(url: string | Buffer) {
    const data = await this.inputAsBuffer(url);
    return await this.session!.api.image.load({
      data,
    });
  }

  protected async prepareModels() {}
  protected async process() {}

  async execute() {
    try {
      await Metastable.instance.comfy!.rpc.session(async ctx => {
        ctx.on('progress', e => {
          this.progress = e.value / e.max;
          this.data = {
            ...this.data,
            stepValue: e.value,
            stepMax: e.max,
            preview: e.preview,
          };
        });

        this.session = ctx;
        await this.prepareModels();
        await ctx.api.instance.cleanupModels({ exceptFor: this.cachedModels });
        await this.process();
      });
    } catch (e) {
      if (this.state === TaskState.CANCELLING) {
        return TaskState.CANCELLED;
      }

      throw e;
    }

    return TaskState.SUCCESS;
  }
}
