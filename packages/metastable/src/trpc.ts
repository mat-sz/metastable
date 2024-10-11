import {
  BackendStatus,
  LogItem,
  Model,
  ModelType,
  ProjectFileType,
  SetupStatus,
  TaskCreateEvent,
  TaskDeleteEvent,
  TaskLogEvent,
  TaskUpdateEvent,
  UpdateInfo,
  Utilization,
} from '@metastable/types';
import { initTRPC, TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { type BrowserWindow } from 'electron';
import type { AppUpdater } from 'electron-updater';
import { Base64 } from 'js-base64';
import { gte } from 'semver';
import { z } from 'zod';

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

        const logItems = metastable.logBuffer.items;
        if (logItems?.length) {
          onEvent(logItems);
        }

        metastable.on('backendLog', onEvent);

        return () => {
          metastable.off('backendLog', onEvent);
        };
      });
    }),
    onBackendStatus: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<BackendStatus>(emit => {
        const onEvent = (data: BackendStatus) => {
          emit.next(data);
        };

        onEvent(metastable.status);
        metastable.on('backendStatus', onEvent);

        return () => {
          metastable.off('backendStatus', onEvent);
        };
      });
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
    restart: t.procedure.mutation(async ({ ctx: { metastable } }) => {
      return await metastable.restartComfy();
    }),
    resetBundle: t.procedure.mutation(async ({ ctx: { metastable } }) => {
      metastable.stopComfy();
      await metastable.config.reset();
      await metastable.deleteBundle();
      await metastable.setup.emitStatus();
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
  },
  model: {
    onChange: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<void>(emit => {
        const onEvent = () => {
          emit.next();
        };

        metastable.model.on('change', onEvent);
        return () => {
          metastable.model.off('change', onEvent);
        };
      });
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
      .input(z.object({ type: z.nativeEnum(ModelType), name: z.string() }))
      .query(async ({ ctx: { metastable }, input: { type, name } }) => {
        const model = await metastable.model.get(type, name);
        return await model.json();
      }),
    update: t.procedure
      .input(
        z.object({
          type: z.nativeEnum(ModelType),
          name: z.string(),
          metadata: z.any(),
        }),
      )
      .mutation(
        async ({ ctx: { metastable }, input: { type, name, metadata } }) => {
          const model = await metastable.model.get(type, name);
          await model.metadata.update(metadata);
          return await model.json();
        },
      ),
    delete: t.procedure
      .input(
        z.object({
          type: z.nativeEnum(ModelType),
          name: z.string(),
        }),
      )
      .mutation(async ({ ctx: { metastable }, input: { type, name } }) => {
        await metastable.model.delete(type, name);
      }),
  },
  setup: {
    onStatus: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<SetupStatus>(emit => {
        const onEvent = (status: SetupStatus) => {
          emit.next(status);
        };

        metastable.setup.on('status', onEvent);

        return () => {
          metastable.setup.off('status', onEvent);
        };
      });
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
      const data = await Promise.all(projects.map(project => project.json()));
      return data.filter(project => !project.temporary);
    }),
    create: t.procedure
      .input(
        z.object({
          name: z.string(),
          type: z.string(),
          settings: z.any(),
          temporary: z.boolean().optional(),
        }),
      )
      .mutation(
        async ({
          ctx: { metastable },
          input: { name, settings, ...metadata },
        }) => {
          const project = await metastable.project.create(name);
          await project.metadata.set(metadata);
          await project.settings.set(settings);
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
          type: z.string().optional(),
          settings: z.any().optional(),
          ui: z.any().optional(),
          temporary: z.boolean().optional(),
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
        const project = await metastable.project.getOrRename(projectId);
        await project.delete();
      }),
    prompt: t.procedure
      .input(z.object({ projectId: z.string(), settings: z.any() }))
      .mutation(
        async ({ ctx: { metastable }, input: { projectId, settings } }) => {
          return await metastable.prompt(projectId, settings);
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
            name: z.string(),
          }),
        )
        .mutation(
          async ({
            ctx: { metastable },
            input: { type, projectId, data, name },
          }) => {
            const project = await metastable.project.get(projectId);
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
    tagger: {
      start: t.procedure
        .input(z.object({ projectId: z.string(), settings: z.any() }))
        .mutation(
          async ({ ctx: { metastable }, input: { projectId, settings } }) => {
            return await metastable.tag(projectId, settings);
          },
        ),
    },
  },
  task: {
    onCreate: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<TaskCreateEvent>(emit => {
        const onEvent = (event: TaskCreateEvent) => {
          emit.next(event);
        };

        metastable.tasks.on('create', onEvent);

        return () => {
          metastable.tasks.off('create', onEvent);
        };
      });
    }),
    onUpdate: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<TaskUpdateEvent>(emit => {
        const onEvent = (event: TaskUpdateEvent) => {
          emit.next(event);
        };

        metastable.tasks.on('update', onEvent);

        return () => {
          metastable.tasks.off('update', onEvent);
        };
      });
    }),
    onDelete: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<TaskDeleteEvent>(emit => {
        const onEvent = (event: TaskDeleteEvent) => {
          emit.next(event);
        };

        metastable.tasks.on('delete', onEvent);

        return () => {
          metastable.tasks.off('delete', onEvent);
        };
      });
    }),
    onLog: t.procedure.subscription(({ ctx: { metastable } }) => {
      return observable<TaskLogEvent>(emit => {
        const onEvent = (event: TaskLogEvent) => {
          emit.next(event);
        };

        metastable.tasks.on('log', onEvent);

        return () => {
          metastable.tasks.off('log', onEvent);
        };
      });
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
      onResize: electronProcedure.subscription(({ ctx: { win } }) => {
        return observable<{ isMaximized: boolean; isFullScreen: boolean }>(
          emit => {
            const refresh = () => {
              emit.next({
                isMaximized: win.isMaximized(),
                isFullScreen: win.isFullScreen(),
              });
            };

            refresh();
            win.on('resize', refresh);

            return () => {
              win.off('resize', refresh);
            };
          },
        );
      }),
      onFocusChange: electronProcedure.subscription(({ ctx: { win } }) => {
        return observable<{ isFocused: boolean }>(emit => {
          const refresh = () => {
            emit.next({
              isFocused: win.isFocused(),
            });
          };

          refresh();
          win.on('focus', refresh);
          win.on('blur', refresh);

          return () => {
            win.off('focus', refresh);
            win.off('blur', refresh);
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
    shell: {
      showItemInFolder: electronProcedure
        .input(z.string())
        .mutation(async ({ input }) => {
          const { shell } = await import('electron');
          shell.showItemInFolder(input);
        }),
      openPath: electronProcedure
        .input(z.string())
        .mutation(async ({ input }) => {
          const { shell } = await import('electron');
          shell.openPath(input);
        }),
    },
    autoUpdater: {
      onUpdateDownloaded: autoUpdaterProcedure.subscription(
        ({ ctx: { autoUpdater } }) => {
          return observable<{ updateDownloaded: boolean; version?: string }>(
            emit => {
              autoUpdater.on('update-downloaded', info => {
                emit.next({
                  updateDownloaded: true,
                  version: info.version,
                });
              });

              return () => {};
            },
          );
        },
      ),
      install: autoUpdaterProcedure.mutation(({ ctx: { autoUpdater } }) => {
        autoUpdater.quitAndInstall();
      }),
    },
  },
});

export type Router = typeof router;
