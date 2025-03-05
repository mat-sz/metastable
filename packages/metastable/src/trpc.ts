import { on } from 'events';
import fs from 'fs/promises';
import path from 'path';

import { semverCompare } from '@metastable/common/semver';
import {
  BackendStatus,
  InstanceAccount,
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
import { toByteArray } from 'base64-js';
import { type App, type BrowserWindow } from 'electron';
import type { AppUpdater } from 'electron-updater';
import { nanoid } from 'nanoid';
import {
  any,
  array,
  boolean,
  enums,
  optional,
  string,
  type,
} from 'superstruct';

import { PostprocessTask } from './comfy/tasks/postprocess.js';
import { PromptTask } from './comfy/tasks/prompt.js';
import { TagTask } from './comfy/tasks/tag.js';
import { TrainingTask } from './comfy/tasks/training.js';
import { direntType, exists, getNextFilename } from './helpers/fs.js';
import type { Metastable } from './index.js';
import * as disk from './sysinfo/disk.js';

export interface TRPCContext {
  metastable: Metastable;
  token?: string;
  user?: InstanceAccount;
  win?: BrowserWindow;
  autoUpdater?: AppUpdater;
  app?: App;
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

const protectedProcedure = t.procedure.use(async opts => {
  const { metastable, token } = opts.ctx;
  if (!(await metastable.auth.isEnabled())) {
    return opts.next(opts);
  }

  if (!token) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  try {
    const user = await metastable.auth.validateToken(token);
    return opts.next({
      ...opts,
      ctx: {
        ...opts.ctx,
        user,
      },
    });
  } catch {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
});

const electronProcedure = protectedProcedure.use(opts => {
  const win = opts.ctx.win;
  if (!win) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED' });
  }

  return opts.next({
    ...opts,
    ctx: {
      ...opts.ctx,
      win: win,
    },
  });
});

const autoUpdaterProcedure = protectedProcedure.use(opts => {
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

const versionEndpointUrl = 'https://update.metastable.studio/version.json';

export const router = t.router({
  download: {
    create: protectedProcedure
      .input(
        type({
          url: string(),
          type: enums(Object.values(ModelType)),
          name: string(),
          targetFolder: optional(string()),
          imageUrl: optional(string()),
          configUrl: optional(string()),
          configType: optional(string()),
          metadata: optional(any()),
        }),
      )
      .mutation(async ({ input, ctx: { metastable } }) => {
        return await metastable.downloadModel(input);
      }),
  },
  instance: {
    onUtilization: protectedProcedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [data] of on(metastable, 'utilization', { signal })) {
        yield data as Utilization;
      }
    }),
    onBackendLog: protectedProcedure.subscription(async function* ({
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
    onBackendStatus: protectedProcedure.subscription(async function* ({
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
    onInfoUpdate: protectedProcedure.subscription(async function* ({
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
    onModelCacheChange: protectedProcedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      const iter = on(metastable, 'comfy.modelCacheChange', {
        signal,
      });

      while (true) {
        yield;
        await iter.next();
      }
    }),
    info: protectedProcedure.query(async ({ ctx: { metastable, app } }) => {
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
        defaultDirectory: app?.getPath('documents') || metastable.dataRoot,
        authAvailable: true,
      };
    }),
    updateInfo: protectedProcedure.query(
      async ({ ctx: { metastable, autoUpdater } }) => {
        let latestVersion: string | undefined = undefined;
        let isUpToDate: boolean | undefined = undefined;

        try {
          const req = await fetch(versionEndpointUrl);
          const json = (await req.json()) as any;
          if (typeof json.version === 'string') {
            latestVersion = json.version;
            if (metastable.settings.version) {
              isUpToDate =
                semverCompare(metastable.settings.version, json.version) === 0;
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
    installFeature: protectedProcedure
      .input(type({ featureId: string() }))
      .mutation(async ({ ctx: { metastable }, input: { featureId } }) => {
        metastable.feature.install(featureId);
      }),
    restart: protectedProcedure.mutation(async ({ ctx: { metastable } }) => {
      return await metastable.restartComfy();
    }),
    resetSettings: protectedProcedure.mutation(
      async ({ ctx: { metastable } }) => {
        await metastable.resetSettings();
      },
    ),
    resetBundle: protectedProcedure
      .input(type({ resetAll: optional(boolean()) }))
      .mutation(async ({ ctx: { metastable }, input: { resetAll } }) => {
        await metastable.setup.resetBundle(resetAll);
      }),
    config: {
      get: protectedProcedure.query(async ({ ctx: { metastable } }) => {
        return await metastable.config.all();
      }),
      set: protectedProcedure
        .input(any())
        .mutation(async ({ ctx: { metastable }, input }) => {
          if (typeof input === 'object') {
            await metastable.config.store(input);
          }
          return await metastable.config.all();
        }),
      onChange: protectedProcedure.subscription(async function* ({
        signal,
        ctx: { metastable },
      }) {
        const iter = on(metastable, 'config.change', { signal });

        while (true) {
          await iter.next();
          yield;
        }
      }),
    },
    validateModelPath: protectedProcedure
      .input(string())
      .query(async ({ input }) => {
        if (!(await exists(input))) {
          throw new Error('Directory not found.');
        }

        return true;
      }),
    listFiles: protectedProcedure.input(string()).query(async ({ input }) => {
      const dir = await fs.readdir(input, { withFileTypes: true });
      const resolved = path.resolve(input);
      const parsed = path.parse(resolved);
      const rootless = parsed.dir.replace(parsed.root, '');
      const segments: { name: string; path: string }[] = [];

      segments.push({
        path: parsed.root,
        name: parsed.root.replaceAll(path.sep, '') || path.sep,
      });

      let current = parsed.root;
      const split = [...rootless.split(path.sep), parsed.base];

      for (const name of split) {
        if (!name) {
          continue;
        }

        current = path.join(current, name);
        segments.push({ path: current, name });
      }

      return {
        path: resolved,
        segments,
        parentPath: parsed.dir,
        items: dir.map(item => ({
          path: path.resolve(item.parentPath, item.name),
          name: item.name,
          type: direntType(item),
        })),
      };
    }),
    createFolder: protectedProcedure
      .input(type({ path: string(), name: string() }))
      .mutation(async ({ input }) => {
        const folderPath = path.join(input.path, input.name);
        await fs.mkdir(folderPath, { recursive: true });
        return folderPath;
      }),
    unloadModels: protectedProcedure.mutation(
      async ({ ctx: { metastable } }) => {
        await metastable.comfy?.rpc.api.instance.cleanupModels({});
      },
    ),
    loadedModels: protectedProcedure.query(async ({ ctx: { metastable } }) => {
      return (await metastable.comfy?.rpc.api.instance.loadedModels()) || [];
    }),
  },
  auth: {
    authenticate: t.procedure
      .input(type({ username: string(), password: string() }))
      .mutation(
        async ({ ctx: { metastable }, input: { username, password } }) => {
          return await metastable.auth.authenticate(username, password);
        },
      ),
    state: protectedProcedure.query(async ({ ctx: { user } }) => {
      return {
        id: user!.id,
        username: user!.username,
      };
    }),
    get: protectedProcedure.query(async ({ ctx: { metastable } }) => {
      return await metastable.auth.get();
    }),
    setEnabled: protectedProcedure
      .input(boolean())
      .mutation(async ({ ctx: { metastable }, input }) => {
        return await metastable.auth.setEnabled(input);
      }),
    user: {
      create: protectedProcedure
        .input(type({ username: string(), password: string() }))
        .mutation(async ({ ctx: { metastable }, input }) => {
          return await metastable.auth.create(input.username, input.password);
        }),
      update: protectedProcedure
        .input(type({ username: string(), password: string() }))
        .mutation(async ({ ctx: { metastable }, input }) => {
          return await metastable.auth.update(input.username, input.password);
        }),
      delete: protectedProcedure
        .input(string())
        .mutation(async ({ ctx: { metastable }, input }) => {
          return await metastable.auth.delete(input);
        }),
    },
  },
  model: {
    onChange: protectedProcedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      const iter = on(metastable, 'model.change', { signal });

      while (true) {
        await iter.next();
        yield;
      }
    }),
    all: protectedProcedure.query(async ({ ctx: { metastable } }) => {
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
    resetCache: protectedProcedure.mutation(async ({ ctx: { metastable } }) => {
      metastable.model.resetCache();
    }),
    get: protectedProcedure
      .input(type({ mrn: string() }))
      .query(async ({ ctx: { metastable }, input: { mrn } }) => {
        const model = await metastable.model.get(mrn);
        return await model.json();
      }),
    update: protectedProcedure
      .input(
        type({
          mrn: string(),
          metadata: any(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input: { mrn, metadata } }) => {
        const model = await metastable.model.get(mrn);
        await model.metadata.update(metadata);
        return await model.json();
      }),
    createMetamodel: protectedProcedure
      .input(
        type({
          name: string(),
          type: enums(Object.values(ModelType)),
          models: any(),
          metadata: any(),
        }),
      )
      .mutation(
        async ({
          ctx: { metastable },
          input: { name, type, models, metadata },
        }) => {
          return await metastable.model.createMetamodel(
            type,
            name,
            models,
            metadata,
          );
        },
      ),
    delete: protectedProcedure
      .input(
        type({
          mrn: string(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input: { mrn } }) => {
        await metastable.model.delete(mrn);
      }),
  },
  setup: {
    onStatus: protectedProcedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [status] of on(metastable.setup, 'status', { signal })) {
        yield status as SetupStatus;
      }
    }),
    status: protectedProcedure.query(async ({ ctx: { metastable } }) => {
      return await metastable.setup.status();
    }),
    details: protectedProcedure.query(async ({ ctx: { metastable } }) => {
      return await metastable.setup.details();
    }),
    prepareDataRoot: protectedProcedure
      .input(string())
      .mutation(async ({ input }) => {
        await fs.mkdir(input, { recursive: true });
        return await disk.usage(input);
      }),
    start: protectedProcedure
      .input(
        type({
          downloads: array(
            type({ name: string(), type: string(), url: string() }),
          ),
          torchMode: string(),
          dataRoot: string(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input }) => {
        return await metastable.setup.start(input as any);
      }),
  },
  project: {
    all: protectedProcedure.query(async ({ ctx: { metastable } }) => {
      const projects = await metastable.project.all();
      const data = await Promise.allSettled(
        projects.map(project => project.json()),
      );
      return data
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(project => !project.draft);
    }),
    create: protectedProcedure
      .input(
        type({
          name: string(),
          type: enums(Object.values(ProjectType)),
          settings: any(),
          ui: optional(any()),
          draft: optional(boolean()),
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
    get: protectedProcedure
      .input(type({ projectId: string() }))
      .query(async ({ ctx: { metastable }, input: { projectId } }) => {
        const project = await metastable.project.get(projectId);
        return await project.json(true);
      }),
    update: protectedProcedure
      .input(
        type({
          projectId: string(),
          name: optional(string()),
          type: optional(enums(Object.values(ProjectType))),
          settings: optional(any()),
          ui: optional(any()),
          draft: optional(boolean()),
          favorite: optional(boolean()),
          tags: optional(array(string())),
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
    delete: protectedProcedure
      .input(
        type({
          projectId: string(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input: { projectId } }) => {
        const project = await metastable.project.get(projectId);
        await project.delete();
      }),
    prompt: protectedProcedure
      .input(type({ projectId: string(), settings: any() }))
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
    train: protectedProcedure
      .input(type({ projectId: string(), settings: any() }))
      .mutation(
        async ({ ctx: { metastable }, input: { projectId, settings } }) => {
          if (metastable.status !== 'ready') {
            return undefined;
          }

          const project = await metastable.project.get(projectId);
          const task = new TrainingTask(project, settings);
          metastable.tasks.queues.project.add(task);

          return { id: task.id };
        },
      ),
    postprocess: protectedProcedure
      .input(type({ projectId: string(), settings: any() }))
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
      all: protectedProcedure
        .input(
          type({
            type: enums(Object.values(ProjectFileType)),
            projectId: string(),
          }),
        )
        .query(async ({ ctx: { metastable }, input: { type, projectId } }) => {
          const project = await metastable.project.get(projectId);
          const files = await project.files[type].all();
          return await Promise.all(files.map(file => file.json()));
        }),
      get: protectedProcedure
        .input(
          type({
            type: enums(Object.values(ProjectFileType)),
            projectId: string(),
            name: string(),
          }),
        )
        .query(
          async ({ ctx: { metastable }, input: { type, projectId, name } }) => {
            const project = await metastable.project.get(projectId);
            const file = await project.files[type].get(name);
            return await file.json(true);
          },
        ),
      create: protectedProcedure
        .input(
          type({
            type: enums(Object.values(ProjectFileType)),
            projectId: string(),
            data: string(),
            name: optional(string()),
            ext: string(),
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
            await file.write(toByteArray(data));
            return await file.json(true);
          },
        ),
      update: protectedProcedure
        .input(
          type({
            type: enums(Object.values(ProjectFileType)),
            projectId: string(),
            name: string(),
            newName: optional(string()),
            metadata: optional(any()),
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
      delete: protectedProcedure
        .input(
          type({
            type: enums(Object.values(ProjectFileType)),
            projectId: string(),
            name: string(),
          }),
        )
        .mutation(
          async ({ ctx: { metastable }, input: { type, projectId, name } }) => {
            const project = await metastable.project.get(projectId);
            await project.files[type].delete(name);
          },
        ),
      onChange: protectedProcedure.subscription(async function* ({
        signal,
        ctx: { metastable },
      }) {
        for await (const [id, type] of on(metastable, 'project.fileChange', {
          signal,
        })) {
          yield {
            id,
            type: type as ProjectFileType,
          };
        }
      }),
    },
    tagger: {
      start: protectedProcedure
        .input(type({ projectId: string(), settings: any() }))
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
    onCreate: protectedProcedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [event] of on(metastable.tasks, 'create', { signal })) {
        yield event as TaskCreateEvent;
      }
    }),
    onUpdate: protectedProcedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [event] of on(metastable.tasks, 'update', { signal })) {
        yield event as TaskUpdateEvent;
      }
    }),
    onDelete: protectedProcedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [event] of on(metastable.tasks, 'delete', { signal })) {
        yield event as TaskDeleteEvent;
      }
    }),
    onLog: protectedProcedure.subscription(async function* ({
      signal,
      ctx: { metastable },
    }) {
      for await (const [event] of on(metastable.tasks, 'log', { signal })) {
        yield event as TaskLogEvent;
      }
    }),
    all: protectedProcedure.query(({ ctx: { metastable } }) => {
      return metastable.tasks.all();
    }),
    queue: protectedProcedure
      .input(type({ queueId: string() }))
      .query(({ ctx: { metastable }, input: { queueId } }) => {
        metastable.tasks.queue(queueId);
      }),
    cancel: protectedProcedure
      .input(type({ queueId: string(), taskId: string() }))
      .mutation(({ ctx: { metastable }, input: { queueId, taskId } }) => {
        metastable.tasks.cancel(queueId, taskId);
      }),
    dismiss: protectedProcedure
      .input(type({ queueId: string(), taskId: string() }))
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
        .input(string())
        .mutation(async ({ input, ctx: { metastable } }) => {
          const { shell } = await import('electron');
          if (input.startsWith('mrn:')) {
            input = await metastable.resolve(input);
          }
          shell.showItemInFolder(input);
        }),
      openPath: electronProcedure
        .input(string())
        .mutation(async ({ input, ctx: { metastable } }) => {
          const { shell } = await import('electron');
          if (input.startsWith('mrn:')) {
            input = await metastable.resolve(input);
          }
          await shell.openPath(input);
        }),
      selectDirectory: electronProcedure
        .input(string())
        .mutation(async ({ ctx: { win }, input }) => {
          const { dialog } = await import('electron');
          const result = await dialog.showOpenDialog(win, {
            defaultPath: input,
            properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
          });
          return result.filePaths[0];
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
