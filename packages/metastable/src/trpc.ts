import { TRPCError, initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';
import type { BrowserWindow } from 'electron';
import { AnyEvent } from '@metastable/types';

import type { Metastable } from './index.js';

export interface TRPCContext {
  metastable: Metastable;
  win?: BrowserWindow;
}

export const t = initTRPC.context<TRPCContext>().create();

const electronProcedure = t.procedure.use(function isElectron(opts) {
  const win = opts.ctx.win;
  if (!win) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED' });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      win: win,
    },
  });
});

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
      .mutation(async ({ input, ctx: { metastable } }) => {
        return await metastable.downloadModel(input);
      }),
  },
  instance: {
    onEvent: t.procedure.subscription(({ ctx: { metastable } }) => {
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
    info: t.procedure.query(async ({ ctx: { metastable } }) => {
      return await metastable.info();
    }),
    restart: t.procedure.mutation(async ({ ctx: { metastable } }) => {
      return await metastable.restartComfy();
    }),
    config: {
      get: t.procedure.query(async ({ ctx: { metastable } }) => {
        return await metastable.storage.config.all();
      }),
      set: t.procedure
        .input(z.any())
        .mutation(async ({ ctx: { metastable }, input }) => {
          if (typeof input === 'object') {
            await metastable.storage.config.store(input);
          }
          return await metastable.storage.config.all();
        }),
    },
  },
  model: {
    all: t.procedure.query(async ({ ctx: { metastable } }) => {
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
      .mutation(
        async ({ ctx: { metastable }, input: { type, name, ...data } }) => {
          return await metastable.storage.models.update(type, name, data);
        },
      ),
    delete: t.procedure
      .input(
        z.object({
          type: z.string(),
          name: z.string(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input: { type, name } }) => {
        await metastable.storage.models.delete(type, name);
      }),
  },
  setup: {
    status: t.procedure.query(async ({ ctx: { metastable } }) => {
      return await metastable.setup.status();
    }),
    details: t.procedure.query(async ({ ctx: { metastable } }) => {
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
      .mutation(async ({ ctx: { metastable }, input }) => {
        return await metastable.setup.start(input as any);
      }),
  },
  project: {
    all: t.procedure.query(async ({ ctx: { metastable } }) => {
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
      .mutation(async ({ ctx: { metastable }, input }) => {
        return await metastable.storage.projects.create(input);
      }),
    get: t.procedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ ctx: { metastable }, input: { projectId } }) => {
        return await metastable.storage.projects.get(projectId);
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
      .mutation(
        async ({ ctx: { metastable }, input: { projectId, ...data } }) => {
          return await metastable.storage.projects.update(projectId, data);
        },
      ),
    prompt: t.procedure
      .input(z.object({ projectId: z.string(), settings: z.any() }))
      .mutation(
        async ({ ctx: { metastable }, input: { projectId, settings } }) => {
          return await metastable.prompt(projectId, settings);
        },
      ),
    input: {
      all: t.procedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx: { metastable }, input: { projectId } }) => {
          return await metastable.storage.projects.inputs(projectId);
        }),
    },
    output: {
      all: t.procedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx: { metastable }, input: { projectId } }) => {
          return await metastable.storage.projects.outputs(projectId);
        }),
    },
    training: {
      start: t.procedure
        .input(z.object({ projectId: z.string(), settings: z.any() }))
        .mutation(
          async ({ ctx: { metastable }, input: { projectId, settings } }) => {
            return await metastable.train(projectId, settings);
          },
        ),
      stop: t.procedure
        .input(z.object({ projectId: z.string() }))
        .mutation(async ({ ctx: { metastable }, input: { projectId } }) => {
          return await metastable.stopTraining(projectId);
        }),
    },
  },
  task: {
    all: t.procedure.query(({ ctx: { metastable } }) => {
      return metastable.tasks.all();
    }),
    queue: t.procedure
      .input(z.object({ queueId: z.string() }))
      .query(({ ctx: { metastable }, input: { queueId } }) => {
        metastable.tasks.queue(queueId);
      }),
    cancel: t.procedure
      .input(z.object({ queueId: z.string(), taskId: z.string() }))
      .mutation(({ ctx: { metastable }, input: { queueId, taskId } }) => {
        metastable.tasks.cancel(queueId, taskId);
      }),
    dismiss: t.procedure
      .input(z.object({ queueId: z.string(), taskId: z.string() }))
      .mutation(({ ctx: { metastable }, input: { queueId, taskId } }) => {
        metastable.tasks.dismiss(queueId, taskId);
      }),
  },
  electron: {
    window: {
      onResize: electronProcedure.subscription(({ ctx: { win } }) => {
        return observable<{ isMaximized: boolean }>(emit => {
          const refresh = () => {
            emit.next({ isMaximized: win.isMaximized() });
          };

          refresh();
          win.on('resize', refresh);

          return () => {
            win.off('resize', refresh);
          };
        });
      }),
      minimize: electronProcedure.mutation(({ ctx: { win } }) => {
        win.minimize();
      }),
      maximize: electronProcedure.mutation(({ ctx: { win } }) => {
        win.maximize();
      }),
      restore: electronProcedure.mutation(({ ctx: { win } }) => {
        win.unmaximize();
      }),
      close: electronProcedure.mutation(({ ctx: { win } }) => {
        win.close();
      }),
    },
  },
});

export type Router = typeof router;
