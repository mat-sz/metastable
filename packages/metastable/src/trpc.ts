import { initTRPC } from '@trpc/server';
import { z } from 'zod';

import type { Metastable } from './index.js';
import { observable } from '@trpc/server/observable';
import { AnyEvent } from '@metastable/types';

let metastable: Metastable = undefined as any;

export function initializeMetastable(newMetastable: Metastable) {
  metastable = newMetastable;
}

const t = initTRPC.create();

export const router = t.router({
  download: {
    create: t.procedure
      .input(
        z.object({
          url: z.string(),
          type: z.string(),
          name: z.string(),
          imageUrl: z.string().optional(),
          info: z.any().optional(),
        }),
      )
      .mutation(async opts => {
        return await metastable.downloadModel(opts.input);
      }),
  },
  instance: {
    onEvent: t.procedure.subscription(() => {
      return observable<AnyEvent>(emit => {
        const onEvent = (data: AnyEvent) => {
          emit.next(data);
        };
        metastable.replayEvents(onEvent);
        metastable.on('event', onEvent);

        return () => {
          metastable.off('event', onEvent);
        };
      });
    }),
    info: t.procedure.query(async () => {
      return await metastable.info();
    }),
    restart: t.procedure.mutation(async () => {
      return await metastable.restartComfy();
    }),
    config: {
      get: t.procedure.query(async () => {
        return await metastable.storage.config.all();
      }),
      set: t.procedure.input(z.any()).mutation(async opts => {
        if (typeof opts.input === 'object') {
          await metastable.storage.config.store(opts.input);
        }
        return await metastable.storage.config.all();
      }),
    },
  },
  model: {
    all: t.procedure.query(async () => {
      return await metastable.storage.models.all();
    }),
    update: t.procedure
      .input(
        z.object({
          type: z.string(),
          name: z.string(),
          longName: z.string(),
          description: z.string(),
          source: z.string(),
          sourceId: z.string(),
          nsfw: z.boolean(),
        }),
      )
      .mutation(async opts => {
        const { type, name, ...data } = opts.input;
        return await metastable.storage.models.update(type, name, data);
      }),
    delete: t.procedure
      .input(
        z.object({
          type: z.string(),
          name: z.string(),
        }),
      )
      .mutation(async opts => {
        const { type, name } = opts.input;
        await metastable.storage.models.delete(type, name);
      }),
  },
  setup: {
    status: t.procedure.query(async () => {
      return await metastable.setup.status();
    }),
    details: t.procedure.query(async () => {
      return await metastable.setup.details();
    }),
    start: t.procedure
      .input(
        z.object({
          downloads: z.array(
            z.object({ name: z.string(), type: z.string(), url: z.string() }),
          ),
          pythonMode: z.string(),
          torchMode: z.string(),
        }),
      )
      .mutation(async opts => {
        return await metastable.setup.start(opts.input as any);
      }),
  },
  project: {
    all: t.procedure.query(async () => {
      return await metastable.storage.projects.all();
    }),
    create: t.procedure
      .input(
        z.object({
          name: z.string(),
          type: z.string(),
          settings: z.string(),
        }),
      )
      .mutation(async opts => {
        return await metastable.storage.projects.create(opts.input);
      }),
    get: t.procedure
      .input(z.object({ projectId: z.string() }))
      .query(async opts => {
        return await metastable.storage.projects.get(opts.input.projectId);
      }),
    update: t.procedure
      .input(
        z.object({
          projectId: z.string(),
          name: z.string().optional(),
          type: z.string().optional(),
          settings: z.string().optional(),
        }),
      )
      .mutation(async opts => {
        const { projectId, ...data } = opts.input;
        return await metastable.storage.projects.update(projectId, data);
      }),
    prompt: t.procedure
      .input(z.object({ projectId: z.string(), settings: z.any() }))
      .mutation(async opts => {
        return await metastable.prompt(
          opts.input.projectId,
          opts.input.settings,
        );
      }),
    input: {
      all: t.procedure
        .input(z.object({ projectId: z.string() }))
        .query(async opts => {
          return await metastable.storage.projects.inputs(opts.input.projectId);
        }),
    },
    output: {
      all: t.procedure
        .input(z.object({ projectId: z.string() }))
        .query(async opts => {
          return await metastable.storage.projects.outputs(
            opts.input.projectId,
          );
        }),
    },
    training: {
      start: t.procedure
        .input(z.object({ projectId: z.string(), settings: z.any() }))
        .mutation(async opts => {
          return await metastable.train(
            opts.input.projectId,
            opts.input.settings,
          );
        }),
      stop: t.procedure
        .input(z.object({ projectId: z.string() }))
        .mutation(async opts => {
          return await metastable.stopTraining(opts.input.projectId);
        }),
    },
  },
  task: {
    all: t.procedure.query(() => {
      return metastable.tasks.all();
    }),
    queue: t.procedure.input(z.object({ queueId: z.string() })).query(opts => {
      metastable.tasks.queue(opts.input.queueId);
    }),
    cancel: t.procedure
      .input(z.object({ queueId: z.string(), taskId: z.string() }))
      .mutation(opts => {
        metastable.tasks.cancel(opts.input.queueId, opts.input.taskId);
      }),
    dismiss: t.procedure
      .input(z.object({ queueId: z.string(), taskId: z.string() }))
      .mutation(opts => {
        metastable.tasks.dismiss(opts.input.queueId, opts.input.taskId);
      }),
  },
});

export type Router = typeof router;
