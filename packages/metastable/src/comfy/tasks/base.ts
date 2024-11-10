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
import { bufferToRpcBytes } from '../session/helpers.js';
import type { ComfySession } from '../session/index.js';

type TaskHandlers = { [key: string]: (...args: any[]) => Promise<void> | void };

export type BaseComfyTaskHandlers = {
  load: () => Promise<void> | void;
};

export class BaseComfyTask<
  THandlers extends TaskHandlers = any,
  TSettings extends BaseSettings = BaseSettings,
> extends BaseTask<ProjectTaskData> {
  public session?: ComfySession;
  private features: Feature[] = [];

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
        return;
      }
    }

    const parsed = MRN.parse(mrn);
    if (parsed.segments[0] !== 'model') {
      throw new Error(`Invalid MRN for model type ${type}: ${mrn}`);
    }

    await Metastable.instance.resolve(mrn);
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
            await this.validateModel(field.modelType, true, parent?.[key]);
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

  async inputAsBuffer(url: string): Promise<Buffer> {
    if (url.startsWith('data:')) {
      return Buffer.from(url.split(',')[1], 'base64');
    }

    if (url.startsWith('mrn:')) {
      return await fs.readFile(await Metastable.instance.resolve(url));
    }

    throw new Error('Unable to load input');
  }

  async loadInputRaw(url: string) {
    const buffer = await this.inputAsBuffer(url);
    return await this.session!.image.load(bufferToRpcBytes(buffer));
  }

  protected async process() {}

  async execute() {
    try {
      await Metastable.instance.comfy!.session(async ctx => {
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
