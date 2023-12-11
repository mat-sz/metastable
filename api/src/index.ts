import path, { resolve } from 'path';
import fs from 'fs/promises';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { PrismaClient } from '@prisma/client';
import createHttpError from 'http-errors';

import { host, port, useProxy, staticRoot } from './config.js';
import { Comfy, ComfyEvent } from './comfy.js';
import {
  createProjectTree,
  findModelByType,
  getModelPath,
  getModels,
  getModelsByType,
  getProjectDataPath,
  projectsPath,
} from './filesystem.js';
import { isPathIn } from './helpers.js';
import { Downloader } from './downloader.js';
import { nanoid } from 'nanoid';

const comfy = new Comfy();
const downloader = new Downloader();

const prisma = new PrismaClient();
const app = Fastify();
app.register(fastifyCompress);

const maxAge = 30 * 24 * 60 * 60 * 1000;

app.register(fastifyStatic, {
  root: projectsPath,
  serve: false,
  cacheControl: false,
  decorateReply: true,
});

if (useProxy) {
  const fastifyHttpProxy = (await import('@fastify/http-proxy')).default;
  app.register(fastifyHttpProxy, {
    upstream: 'http://127.0.0.1:3000/',
  });
} else {
  const STATIC_ROOT = resolve(staticRoot);

  app.setNotFoundHandler((req, reply) => {
    const split = req.url.split('/');

    if (split.length === 2) {
      // For paths like /xyz we want to send the frontend.
      // This will not interfere with 404 errors for
      // truly not found files.
      reply.sendFile('index.html', STATIC_ROOT);
      return;
    }

    reply.status(404);
    reply.send('Not found');
  });
  app.register(fastifyStatic, {
    root: STATIC_ROOT,
    prefix: '/',
    index: 'index.html',
    cacheControl: false,
    decorateReply: false,
  });
  app.register(fastifyStatic, {
    root: path.join(STATIC_ROOT, 'assets'),
    prefix: '/assets',
    cacheControl: true,
    immutable: true,
    maxAge,
    decorateReply: false,
  });
  app.register(fastifyStatic, {
    root: path.join(STATIC_ROOT, 'locales'),
    prefix: '/locales',
    cacheControl: true,
    immutable: true,
    maxAge,
    decorateReply: false,
  });
}

comfy.on('event', async event => {
  console.log('[Comfy]', event);

  if (event.event === 'prompt.end') {
    const filename = event.data?.output_filenames?.[0];

    if (filename) {
      const projectId = parseInt(event.data.project_id);
      await prisma.project.update({
        data: { lastOutput: filename },
        where: { id: projectId },
      });
    }
  }
});

app.register(fastifyWebsocket);
app.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const ws = connection.socket;

    const onEvent = (event: ComfyEvent) => {
      ws.send(JSON.stringify(event));
    };
    comfy.on('event', onEvent);
    downloader.on('event', onEvent);

    ws.on('error', error => {
      console.log('[ERROR (Handled)]', error.message);
    });

    ws.on('message', (data: string) => {});

    ws.on('close', () => {
      comfy.off('event', onEvent);
      downloader.off('event', onEvent);
    });
  });
});

const projectBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    settings: { type: 'string' },
  },
} as const satisfies JSONSchema;

const projectBodyCreate = {
  ...projectBody,
  required: ['name'],
} as const satisfies JSONSchema;

const projectSelect = {
  id: true,
  name: true,
  lastOutput: true,
  settings: true,
  createdAt: true,
  updatedAt: true,
};

const modelBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    imageUrl: { type: 'string' },
    type: { type: 'string' },
    filename: { type: 'string' },
    source: { type: 'string' },
    sourceId: { type: 'string' },
  },
} as const satisfies JSONSchema;

const modelBodyCreate = {
  ...modelBody,
  required: ['name', 'type', 'filename'],
} as const satisfies JSONSchema;

const modelSelect = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  type: true,
  filename: true,
  source: true,
  sourceId: true,
  createdAt: true,
  updatedAt: true,
};

const downloadBody = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    type: { type: 'string' },
    filename: { type: 'string' },
  },
  required: ['url', 'filename', 'type'],
} as const satisfies JSONSchema;

const promptBody = {
  type: 'object',
  properties: {
    project_id: {
      type: 'number',
    },
    models: {
      type: 'object',
      properties: {
        base: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        loras: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              strength: { type: 'number' },
            },
            required: ['name', 'strength'],
          },
        },
        controlnets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              strength: { type: 'number' },
              image: { type: 'string' },
            },
            required: ['name', 'strength', 'image'],
          },
        },
      },
      required: ['base'],
    },
    conditioning: {
      type: 'object',
      properties: {
        positive: { type: 'string' },
        negative: { type: 'string' },
      },
      required: ['positive', 'negative'],
    },
    sampler: {
      type: 'object',
      properties: {
        seed: { type: 'number' },
        steps: { type: 'number' },
        cfg: { type: 'number' },
        denoise: { type: 'number' },
        sampler: { type: 'string' },
        scheduler: { type: 'string' },
        preview: {
          type: 'object',
          properties: {
            method: { type: 'string' },
          },
          required: ['method'],
        },
      },
      required: ['seed', 'steps', 'cfg', 'denoise', 'sampler', 'scheduler'],
    },
  },
  required: ['project_id', 'models', 'conditioning', 'sampler'],
} as const satisfies JSONSchema;

app.get('/info', async () => {
  return {
    samplers: comfy.samplers,
    schedulers: comfy.schedulers,
    models: await getModels(),
  };
});

app.register(
  async fastify => {
    fastify.get('/', async () => {
      return await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          lastOutput: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    fastify.post<{
      Body: FromSchema<typeof projectBodyCreate>;
    }>(
      '/',
      {
        schema: {
          body: projectBodyCreate,
        },
      },
      async request => {
        return await prisma.project.create({
          data: request.body,
          select: projectSelect,
        });
      },
    );

    fastify.get('/:id', async request => {
      const projectId = parseInt((request.params as any)?.id);
      return prisma.project.findFirst({
        select: projectSelect,
        where: { id: projectId },
      });
    });

    fastify.post<{ Body: FromSchema<typeof projectBody> }>(
      '/:id',
      {
        schema: {
          body: projectBody,
        },
      },
      async request => {
        const projectId = parseInt((request.params as any)?.id);
        return await prisma.project.update({
          where: { id: projectId },
          data: request.body,
          select: projectSelect,
        });
      },
    );

    fastify.delete('/:id', async request => {
      const projectId = parseInt((request.params as any)?.id);
      await prisma.project.delete({
        where: { id: projectId },
      });
      return { ok: true };
    });

    fastify.get('/:id/outputs', async request => {
      const projectId = parseInt((request.params as any)?.id);
      try {
        const files = await fs.readdir(
          path.join(projectsPath, `${projectId}`, 'output'),
        );
        return files;
      } catch {
        return [];
      }
    });

    fastify.get('/:id/outputs/:filename', async (request, reply) => {
      const projectId = parseInt((request.params as any)?.id);
      const fileName = (request.params as any)?.filename;
      const projectPath = path.join(projectsPath, `${projectId}`, 'output');
      const filePath = path.join(projectPath, fileName);
      if (!isPathIn(projectPath, filePath)) {
        return createHttpError(404);
      }

      return reply.sendFile(fileName, projectPath);
    });
  },
  { prefix: '/projects' },
);

app.register(
  async fastify => {
    fastify.get('/', async () => {
      return await prisma.model.findMany({
        select: modelSelect,
      });
    });

    fastify.post<{
      Body: FromSchema<typeof modelBodyCreate>;
    }>(
      '/',
      {
        schema: {
          body: modelBodyCreate,
        },
      },
      async request => {
        return await prisma.model.create({
          data: request.body,
          select: modelSelect,
        });
      },
    );

    fastify.get('/:id', async request => {
      const modelId = parseInt((request.params as any)?.id);
      return prisma.model.findFirst({
        select: modelSelect,
        where: { id: modelId },
      });
    });

    fastify.post<{ Body: FromSchema<typeof modelBody> }>(
      '/:id',
      {
        schema: {
          body: modelBody,
        },
      },
      async request => {
        const modelId = parseInt((request.params as any)?.id);
        return await prisma.model.update({
          where: { id: modelId },
          data: request.body,
          select: modelSelect,
        });
      },
    );

    fastify.delete('/:id', async request => {
      const modelId = parseInt((request.params as any)?.id);
      await prisma.model.delete({
        where: { id: modelId },
      });
      return { ok: true };
    });
  },
  { prefix: '/models' },
);

app.register(
  async fastify => {
    fastify.post<{ Body: FromSchema<typeof downloadBody> }>(
      '/',
      {
        schema: {
          body: downloadBody,
        },
      },
      async request => {
        return {
          download_id: downloader.add(
            request.body.type,
            request.body.url,
            request.body.filename,
          ),
        };
      },
    );
  },
  { prefix: '/downloads' },
);

app.register(
  async fastify => {
    fastify.post<{
      Body: FromSchema<typeof promptBody>;
    }>(
      '/',
      {
        schema: {
          body: promptBody,
        },
      },
      async request => {
        await createProjectTree(request.body.project_id);

        const settings = request.body;
        settings.models.base.path = getModelPath(
          'checkpoints',
          settings.models.base.name,
        );

        if (settings.models.loras) {
          for (const lora of settings.models.loras) {
            lora.path = getModelPath('loras', lora.name);
          }
        }

        if (settings.models.controlnets) {
          for (const controlnet of settings.models.controlnets) {
            controlnet.path = getModelPath('controlnet', controlnet.name);
          }
        }

        if (settings.sampler.preview?.method === 'taesd') {
          const list = await getModelsByType('vae_approx');
          settings.sampler.preview.taesd = {
            taesd_decoder: await findModelByType(list, 'taesd_decoder'),
            taesdxl_decoder: await findModelByType(list, 'taesdxl_decoder'),
          };
        }

        const id = nanoid();

        comfy.send('prompt', {
          ...request.body,
          prompt_id: id,
          output_path: getProjectDataPath(request.body.project_id, 'output'),
        });

        return { id };
      },
    );
  },
  { prefix: '/prompts' },
);

app.listen({ host, port });

console.log(`Server running on ${host}:${port}`);
