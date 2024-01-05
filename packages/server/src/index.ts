import path, { resolve } from 'path';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';
import { Metastable } from '@metastable/metastable';

import {
  host,
  port,
  useProxy,
  staticRoot,
  dataRoot,
  skipPythonSetup,
} from './config.js';
import { routesProjects } from './routes/projects.js';
import { routesModels } from './routes/models.js';
import { routesPrompts } from './routes/prompts.js';
import { routesDownloads } from './routes/downloads.js';
import { routesInstance } from './routes/instance.js';
import { routesSetup } from './routes/setup.js';
import { ClientManager } from './ws.js';
import { routesTasks } from './routes/tasks.js';

const metastable = new Metastable(dataRoot, { skipPythonSetup });
const clientManager = new ClientManager();

await metastable.init();

const app = Fastify();
app.register(fastifyCompress);

const maxAge = 30 * 24 * 60 * 60 * 1000;

app.register(fastifyStatic, {
  root: metastable.storage.dataRoot,
  prefix: '/static',
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

metastable.on('event', event => {
  clientManager.broadcast(event);
});

app.register(fastifyWebsocket);
app.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, connection => {
    const client = clientManager.add(connection.socket);
    metastable.replayEvents(event => client.send(event));
  });
});

app.register(routesInstance(metastable), { prefix: '/instance' });
app.register(routesSetup(metastable), { prefix: '/setup' });
app.register(routesProjects(metastable), { prefix: '/projects' });
app.register(routesModels(metastable), { prefix: '/models' });
app.register(routesPrompts(metastable), { prefix: '/prompts' });
app.register(routesDownloads(metastable), { prefix: '/downloads' });
app.register(routesTasks(metastable), { prefix: '/tasks' });

app.listen({ host, port });

console.log(`Server running on ${host}:${port}`);
