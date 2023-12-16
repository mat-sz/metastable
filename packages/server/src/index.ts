import path, { resolve } from 'path';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';
import { PrismaClient } from '@prisma/client';
import { Comfy, createPythonInstance } from '@metastable/comfy';
import { Downloader } from '@metastable/downloader';
import { FileSystem } from '@metastable/fs-helpers';

import { host, port, useProxy, staticRoot, dataRoot } from './config.js';
import { routesProjects } from './routes/projects.js';
import { routesModels } from './routes/models.js';
import { routesPrompts } from './routes/prompts.js';
import { routesDownloads } from './routes/downloads.js';
import { routesInstance } from './routes/instance.js';
import { ClientManager } from './ws.js';

const prisma = new PrismaClient();
const python = await createPythonInstance();
const comfy = new Comfy(python);
const downloader = new Downloader(dataRoot);
const clientManager = new ClientManager();
const fileSystem = new FileSystem(dataRoot);

const app = Fastify();
app.register(fastifyCompress);

const maxAge = 30 * 24 * 60 * 60 * 1000;

app.register(fastifyStatic, {
  root: fileSystem.modelsDir,
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
  clientManager.broadcast(event);

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

comfy.on('reset', () => {
  clientManager.broadcast({
    event: 'prompt.queue',
    data: {
      queue_remaining: comfy.queue_remaining,
    },
  });
});

downloader.on('event', event => {
  clientManager.broadcast(event);
});

app.register(fastifyWebsocket);
app.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, connection => {
    const client = clientManager.add(connection.socket);

    client.send({
      event: 'prompt.queue',
      data: {
        queue_remaining: comfy.queue_remaining,
      },
    });
    client.send({
      event: 'backend.status',
      data: comfy.status,
    });
    client.send({
      event: 'backend.logBuffer',
      data: comfy.logBuffer.items,
    });

    if (comfy.torchInfo) {
      client.send({
        event: 'info.torch',
        data: comfy.torchInfo,
      });
    }
  });
});

app.register(routesInstance(comfy, fileSystem), { prefix: '/instance' });
app.register(routesProjects(prisma, fileSystem), { prefix: '/projects' });
app.register(routesModels(prisma), { prefix: '/models' });
app.register(routesPrompts(prisma, comfy, fileSystem), { prefix: '/prompts' });
app.register(routesDownloads(downloader), { prefix: '/downloads' });

app.listen({ host, port });

console.log(`Server running on ${host}:${port}`);
