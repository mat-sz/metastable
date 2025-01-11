import { on } from 'events';

import {
  BackendStatus,
  LogItem,
  Model,
  ModelType,
  ProjectFileType,
  ProjectType,
  SetupStatus,
  TaskCreateEvent,
  TaskDeleteEvent,
  TaskLogEvent,
  TaskUpdateEvent,
  UpdateInfo,
  Utilization,
} from '@metastable/types';
import { initTRPC, TRPCError } from '@trpc/server';
import { type BrowserWindow } from 'electron';
import type { AppUpdater } from 'electron-updater';
import { Base64 } from 'js-base64';
import { nanoid } from 'nanoid';
import { gte } from 'semver';
import { z } from 'zod';

import { PostprocessTask } from './comfy/tasks/postprocess.js';
import { PromptTask } from './comfy/tasks/prompt.js';
import { TagTask } from './comfy/tasks/tag.js';
import { exists, getNextFilename } from './helpers/fs.js';
import type { Metastable } from './index.js';

export interface TRPCContext {
  metastable: Metastable;
  win?: BrowserWindow;
  autoUpdater?: AppUpdater;
}

const transformer = {
  serialize(data: any) {
    return JSON.stringify(data);
  },
  deserialize(data: any) {
    if (typeof data === 'undefined') {
      return undefined;
    }

    return JSON.parse(data);
  },
};

export const t = initTRPC.context<TRPCContext>().create({
  transformer,
});

const electronProcedure = t.procedure.use(opts => {
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

const autoUpdaterProcedure = t.procedure.use(opts => {
  const autoUpdater = opts.ctx.autoUpdater;
  if (!autoUpdater) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED' });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      autoUpdater: autoUpdater,
    },
  });
});

const versionEndpointUrl = 'https://update.metastable.studio/version';

export const router = t.router({
  download: {
    create: t.procedure
      .input(
        z.object({
          url: z.string(),
          type: z.nativeEnum(ModelType),
          name: z.string(),
          imageUrl: z.string().optional(),
          configUrl: z.string().optional(),
          configType: z.string().optional(),
          metadata: z.any().optional(),
        }),
      )
      .mutation(async ({ input, ctx: { metastable } }) => {
        return await metastable.downloadModel(input);
      }),
  },
  instance: {
    onUtilization: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [data] of on(metastable, 'utilization', { signal })) {
        yield data as Utilization;
      }
    }),
    onBackendLog: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      const logItems = metastable.logBuffer.items;
      if (logItems?.length) {
        yield logItems;
      }

      for await (const [data] of on(metastable.logBuffer, 'append', {
        signal,
      })) {
        yield [data as LogItem];
      }
    }),
    onBackendStatus: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      yield metastable.status;

      for await (const [data] of on(metastable, 'backendStatus', {
        signal,
      })) {
        yield data as BackendStatus;
      }
    }),
    onInfoUpdate: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      const iter = on(metastable, 'infoUpdate', {
        signal,
      });

      while (true) {
        yield;
        await iter.next();
      }
    }),
    info: t.procedure.query(async ({ ctx: { metastable } }) => {
      const info = (await metastable.comfy?.info()) || {
        schedulers: [],
        samplers: [],
        torch: undefined,
      };

      let vram = metastable.vram;
      if (info.torch?.memory.vram) {
        vram = info.torch.memory.vram;
      }

      return {
        ...info,
        vram,
        dataRoot: metastable.dataRoot,
        features: await metastable.feature.all(),
      };
    }),
    updateInfo: t.procedure.query(
      async ({ ctx: { metastable, autoUpdater } }) => {
        let latestVersion: string | undefined = undefined;
        let isUpToDate: boolean | undefined = undefined;

        try {
          const req = await fetch(versionEndpointUrl);
          const json = (await req.json()) as any;
          if (typeof json.version === 'string') {
            latestVersion = json.version;
            if (metastable.settings.version) {
              isUpToDate = gte(metastable.settings.version, json.version);
            }
          }
        } catch (e) {
          console.error('Unable to fetch update info', e);
        }

        return {
          canCheckForUpdate: true,
          isAutoUpdateAvailable: !!autoUpdater?.isUpdaterActive(),
          latestVersion,
          isUpToDate,
        } as UpdateInfo;
      },
    ),
    installFeature: t.procedure
      .input(z.object({ featureId: z.string() }))
      .mutation(async ({ ctx: { metastable }, input: { featureId } }) => {
        metastable.feature.install(featureId);
      }),
    restart: t.procedure.mutation(async ({ ctx: { metastable } }) => {
      return await metastable.restartComfy();
    }),
    resetSettings: t.procedure.mutation(async ({ ctx: { metastable } }) => {
      await metastable.resetSettings();
    }),
    resetBundle: t.procedure
      .input(z.object({ resetAll: z.boolean().optional() }))
      .mutation(async ({ ctx: { metastable }, input: { resetAll } }) => {
        await metastable.setup.resetBundle(resetAll);
      }),
    config: {
      get: t.procedure.query(async ({ ctx: { metastable } }) => {
        return await metastable.config.all();
      }),
      set: t.procedure
        .input(z.any())
        .mutation(async ({ ctx: { metastable }, input }) => {
          if (typeof input === 'object') {
            await metastable.config.store(input);
          }
          return await metastable.config.all();
        }),
    },
    validateModelPath: t.procedure
      .input(z.string())
      .query(async ({ input }) => {
        if (!(await exists(input))) {
          throw new Error('Directory not found.');
        }

        return true;
      }),
  },
  model: {
    onChange: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      const iter = on(metastable.model, 'change', { signal });

      while (true) {
        await iter.next();
        yield;
      }
    }),
    all: t.procedure.query(async ({ ctx: { metastable } }) => {
      const models = await metastable.model.all();
      const jsons = await Promise.all(models.map(model => model.json()));
      const map: Record<string, Model[]> = {};
      for (const json of jsons) {
        if (!map[json.type]) {
          map[json.type] = [];
        }
        map[json.type].push(json);
      }

      return map;
    }),
    get: t.procedure
      .input(z.object({ mrn: z.string() }))
      .query(async ({ ctx: { metastable }, input: { mrn } }) => {
        const model = await metastable.model.get(mrn);
        return await model.json();
      }),
    update: t.procedure
      .input(
        z.object({
          mrn: z.string(),
          metadata: z.any(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input: { mrn, metadata } }) => {
        const model = await metastable.model.get(mrn);
        await model.metadata.update(metadata);
        return await model.json();
      }),
    createMetamodel: t.procedure
      .input(
        z.object({
          name: z.string(),
          type: z.nativeEnum(ModelType),
          models: z.any(),
        }),
      )
      .mutation(
        async ({ ctx: { metastable }, input: { name, type, models } }) => {
          return await metastable.model.createMetamodel(type, name, models);
        },
      ),
    delete: t.procedure
      .input(
        z.object({
          mrn: z.string(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input: { mrn } }) => {
        await metastable.model.delete(mrn);
      }),
  },
  setup: {
    onStatus: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [status] of on(metastable.setup, 'status', { signal })) {
        yield status as SetupStatus;
      }
    }),
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
      const data = await Promise.allSettled(
        projects.map(project => project.json()),
      );
      return data
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(project => !project.draft);
    }),
    create: t.procedure
      .input(
        z.object({
          name: z.string(),
          type: z.nativeEnum(ProjectType),
          settings: z.any(),
          ui: z.any().optional(),
          draft: z.boolean().optional(),
        }),
      )
      .mutation(
        async ({
          ctx: { metastable },
          input: { name, settings, ui, ...metadata },
        }) => {
          const project = await metastable.project.create(name);
          await project.metadata.set({
            id: nanoid(),
            ...metadata,
          });
          await project.settings.set(settings);

          if (ui) {
            await project.ui.set(ui);
          }

          return await project.json(true);
        },
      ),
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
          type: z.nativeEnum(ProjectType).optional(),
          settings: z.any().optional(),
          ui: z.any().optional(),
          draft: z.boolean().optional(),
        }),
      )
      .mutation(
        async ({
          ctx: { metastable },
          input: { projectId, settings, name, ui, ...metadata },
        }) => {
          const project = await metastable.project.getOrRename(projectId, name);

          if (metadata) {
            await project.metadata.update(metadata);
          }

          if (settings) {
            await project.settings.set(settings);
          }

          if (ui) {
            await project.ui.set(ui);
          }

          return await project.json(true);
        },
      ),
    delete: t.procedure
      .input(
        z.object({
          projectId: z.string(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input: { projectId } }) => {
        const project = await metastable.project.get(projectId);
        await project.delete();
      }),
    prompt: t.procedure
      .input(z.object({ projectId: z.string(), settings: z.any() }))
      .mutation(
        async ({ ctx: { metastable }, input: { projectId, settings } }) => {
          if (metastable.status !== 'ready') {
            return undefined;
          }

          const project = await metastable.project.get(projectId);
          const task = new PromptTask(project, settings);
          metastable.tasks.queues.project.add(task);

          return { id: task.id };
        },
      ),
    postprocess: t.procedure
      .input(z.object({ projectId: z.string(), settings: z.any() }))
      .mutation(
        async ({ ctx: { metastable }, input: { projectId, settings } }) => {
          if (metastable.status !== 'ready') {
            return undefined;
          }

          const project = await metastable.project.get(projectId);
          const task = new PostprocessTask(project, settings);
          metastable.tasks.queues.project.add(task);

          return { id: task.id };
        },
      ),
    file: {
      all: t.procedure
        .input(
          z.object({
            type: z.nativeEnum(ProjectFileType),
            projectId: z.string(),
          }),
        )
        .query(async ({ ctx: { metastable }, input: { type, projectId } }) => {
          const project = await metastable.project.get(projectId);
          const files = await project.files[type].all();
          return await Promise.all(files.map(file => file.json()));
        }),
      get: t.procedure
        .input(
          z.object({
            type: z.nativeEnum(ProjectFileType),
            projectId: z.string(),
            name: z.string(),
          }),
        )
        .query(
          async ({ ctx: { metastable }, input: { type, projectId, name } }) => {
            const project = await metastable.project.get(projectId);
            const file = await project.files[type].get(name);
            return await file.json(true);
          },
        ),
      create: t.procedure
        .input(
          z.object({
            type: z.nativeEnum(ProjectFileType),
            projectId: z.string(),
            data: z.string(),
            name: z.string().optional(),
            ext: z.string(),
          }),
        )
        .mutation(
          async ({
            ctx: { metastable },
            input: { type, projectId, data, name, ext },
          }) => {
            const project = await metastable.project.get(projectId);
            if (!name) {
              name = await getNextFilename(project.files[type].path, ext);
            }

            const file = await project.files[type].create(name);
            await file.write(Base64.toUint8Array(data));
            return await file.json(true);
          },
        ),
      update: t.procedure
        .input(
          z.object({
            type: z.nativeEnum(ProjectFileType),
            projectId: z.string(),
            name: z.string(),
            newName: z.string().optional(),
            metadata: z.any().optional(),
          }),
        )
        .mutation(
          async ({
            ctx: { metastable },
            input: { type, projectId, name, newName, metadata },
          }) => {
            const project = await metastable.project.get(projectId);
            const file = await project.files[type].getOrRename(name, newName);
            await file.metadata.update(metadata);
            return await file.json(true);
          },
        ),
      delete: t.procedure
        .input(
          z.object({
            type: z.nativeEnum(ProjectFileType),
            projectId: z.string(),
            name: z.string(),
          }),
        )
        .mutation(
          async ({ ctx: { metastable }, input: { type, projectId, name } }) => {
            const project = await metastable.project.get(projectId);
            await project.files[type].delete(name);
          },
        ),
      onChange: t.procedure
        .input(
          z.object({
            projectId: z.string(),
          }),
        )
        .subscription(async function* ({
          signal,
          ctx: { metastable },
          input: { projectId },
        }) {
          for await (const [id, type] of on(metastable.model, 'change', {
            signal,
          })) {
            if (id === projectId) {
              yield type as ProjectFileType;
            }
          }
        }),
    },
    tagger: {
      start: t.procedure
        .input(z.object({ projectId: z.string(), settings: z.any() }))
        .mutation(
          async ({ ctx: { metastable }, input: { projectId, settings } }) => {
            if (metastable.status !== 'ready') {
              return undefined;
            }

            const project = await metastable.project.get(projectId);
            const task = new TagTask(project, settings);
            metastable.tasks.queues.project.add(task);

            return { id: task.id };
          },
        ),
    },
  },
  task: {
    onCreate: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [event] of on(metastable.tasks, 'create', { signal })) {
        yield event as TaskCreateEvent;
      }
    }),
    onUpdate: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [event] of on(metastable.tasks, 'update', { signal })) {
        yield event as TaskUpdateEvent;
      }
    }),
    onDelete: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [event] of on(metastable.tasks, 'delete', { signal })) {
        yield event as TaskDeleteEvent;
      }
    }),
    onLog: t.procedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [event] of on(metastable.tasks, 'log', { signal })) {
        yield event as TaskLogEvent;
      }
    }),
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
      onResize: electronProcedure.subscription(async function* ({
        signal,
        ctx: { win },
      }) {
        const iter = on(win, 'resize', { signal });

        while (true) {
          yield {
            isMaximized: win.isMaximized(),
            isFullScreen: win.isFullScreen(),
          };
          await iter.next();
        }
      }),
      onFocusChange: electronProcedure.subscription(async function* ({
        signal,
        ctx: { win },
      }) {
        const iterators = [
          on(win, 'focus', { signal }),
          on(win, 'blur', { signal }),
        ];

        while (true) {
          yield {
            isFocused: win.isFocused(),
          };
          await Promise.race(iterators.map(iterators => iterators.next()));
        }
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
    shell: {
      showItemInFolder: electronProcedure
        .input(z.string())
        .mutation(async ({ input, ctx: { metastable } }) => {
          const { shell } = await import('electron');
          if (input.startsWith('mrn:')) {
            input = await metastable.resolve(input);
          }
          shell.showItemInFolder(input);
        }),
      openPath: electronProcedure
        .input(z.string())
        .mutation(async ({ input, ctx: { metastable } }) => {
          const { shell } = await import('electron');
          if (input.startsWith('mrn:')) {
            input = await metastable.resolve(input);
          }
          await shell.openPath(input);
        }),
    },
    autoUpdater: {
      onUpdateDownloaded: autoUpdaterProcedure.subscription(async function* ({
        signal,
        ctx: { autoUpdater },
      }) {
        for await (const [info] of on(autoUpdater, 'update-downloaded', {
          signal,
        })) {
          yield {
            updateDownloaded: true,
            version: info.version,
          };
        }
      }),
      install: autoUpdaterProcedure.mutation(({ ctx: { autoUpdater } }) => {
        autoUpdater.quitAndInstall();
      }),
    },
  },
});

export type Router = typeof router;
