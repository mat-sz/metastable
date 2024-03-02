import { TRPCError, initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';
import type { BrowserWindow } from 'electron';
import { AnyEvent, LogItem, Utilization } from '@metastable/types';
import { Base64 } from 'js-base64';

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
    onUtilization: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<Utilization>(emit => {
        const onEvent = (data: Utilization) => {
          emit.next(data);
        };

        metastable.on('utilization', onEvent);

        return () => {
          metastable.off('utilization', onEvent);
        };
      });
    }),
    onBackendLog: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<LogItem[]>(emit => {
        const onEvent = (data: LogItem[]) => {
          emit.next(data);
        };

        const logItems = metastable.comfy?.logBuffer.items;
        if (logItems?.length) {
          onEvent(logItems);
        }

        metastable.on('backendLog', onEvent);

        return () => {
          metastable.off('backendLog', onEvent);
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
      const projects = await metastable.project.all();
      return await Promise.all(projects.map(project => project.json()));
    }),
    create: t.procedure
      .input(
        z.object({
          name: z.string(),
          type: z.string(),
          settings: z.any(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input }) => {
        const project = await metastable.project.create(input.name);
        await project.metadata.set({ type: input.type });
        await project.settings.set(input.settings);
        return await project.json(true);
      }),
    get: t.procedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ ctx: { metastable }, input: { projectId } }) => {
        const project = await metastable.project.get(projectId);
        return await project.json(true);
      }),
    update: t.procedure
      .input(
        z.object({
          projectId: z.string(),
          name: z.string().optional(),
          type: z.string().optional(),
          settings: z.any().optional(),
        }),
      )
      .mutation(
        async ({
          ctx: { metastable },
          input: { projectId, settings, name, ...metadata },
        }) => {
          const project = await metastable.project.getOrRename(projectId, name);

          if (metadata) {
            await project.metadata.update(metadata);
          }

          if (settings) {
            await project.settings.set(settings);
          }

          return await project.json(true);
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
          const project = await metastable.project.get(projectId);
          const inputs = await project.input.all();

          return inputs.map(input => input.name);
        }),
      get: t.procedure
        .input(
          z.object({
            projectId: z.string(),
            name: z.string(),
          }),
        )
        .query(async ({ ctx: { metastable }, input: { projectId, name } }) => {
          const project = await metastable.project.get(projectId);
          const input = await project.input.get(name);
          return await input.json();
        }),
      create: t.procedure
        .input(
          z.object({
            projectId: z.string(),
            data: z.string(),
            name: z.string(),
          }),
        )
        .mutation(
          async ({ ctx: { metastable }, input: { projectId, data, name } }) => {
            const project = await metastable.project.get(projectId);
            const input = await project.input.create(name);

            await input.write(Base64.toUint8Array(data));
            return await input.json();
          },
        ),
      update: t.procedure
        .input(
          z.object({
            projectId: z.string(),
            name: z.string(),
            newName: z.string().optional(),
            metadata: z.any().optional(),
          }),
        )
        .mutation(
          async ({
            ctx: { metastable },
            input: { projectId, name, newName, metadata },
          }) => {
            const project = await metastable.project.get(projectId);
            const input = await project.input.getOrRename(name, newName);

            await input.metadata.update(metadata);
            return await input.json();
          },
        ),
      delete: t.procedure
        .input(
          z.object({
            projectId: z.string(),
            name: z.string(),
          }),
        )
        .mutation(
          async ({ ctx: { metastable }, input: { projectId, name } }) => {
            const project = await metastable.project.get(projectId);
            await project.input.delete(name);
          },
        ),
    },
    output: {
      all: t.procedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx: { metastable }, input: { projectId } }) => {
          const project = await metastable.project.get(projectId);
          const outputs = await project.output.all();

          return outputs.map(output => output.name);
        }),
      get: t.procedure
        .input(
          z.object({
            projectId: z.string(),
            name: z.string(),
          }),
        )
        .query(async ({ ctx: { metastable }, input: { projectId, name } }) => {
          const project = await metastable.project.get(projectId);
          const output = await project.output.get(name);
          return await output.json();
        }),
      delete: t.procedure
        .input(
          z.object({
            projectId: z.string(),
            name: z.string(),
          }),
        )
        .mutation(
          async ({ ctx: { metastable }, input: { projectId, name } }) => {
            const project = await metastable.project.get(projectId);
            await project.output.delete(name);
          },
        ),
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
