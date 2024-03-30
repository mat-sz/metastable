import path from 'path';

import fastifyCompress from '@fastify/compress';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { Metastable, router, Router } from '@metastable/metastable';
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';

import {
  dataRoot,
  host,
  port,
  skipPythonSetup,
  staticRoot,
  useProxy,
} from './config.js';

const metastable = new Metastable(dataRoot, { skipPythonSetup });
await metastable.init();

const app = Fastify({ maxParamLength: 5000, bodyLimit: 50 * 1024 * 1024 });
app.register(fastifyCompress);

const maxAge = 30 * 24 * 60 * 60 * 1000;

app.register(fastifyStatic, {
  root: metastable.storage.dataRoot,
  prefix: '/temp',
  cacheControl: false,
  decorateReply: true,
});

if (useProxy) {
  const fastifyHttpProxy = (await import('@fastify/http-proxy')).default;
  app.register(fastifyHttpProxy, {
    upstream: 'http://127.0.0.1:3000/',
  });
} else {
  const STATIC_ROOT = path.resolve(staticRoot);

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

app.register(fastifyMultipart);
app.register(fastifyWebsocket);

app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  useWSS: true,
  trpcOptions: {
    router: router,
    createContext: () => {
      return { metastable };
    },
    onError({ path, error }) {
      // report to error monitoring
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<Router>['trpcOptions'],
});

app.get('/static', (req, reply) => {
  const filePath = (req.query as any)?.path;
  if (filePath) {
    reply.sendFile(path.basename(filePath), path.dirname(filePath));
  } else {
    reply.status(404);
    reply.send('Not found');
  }
});

app.listen({ host, port });

console.log(`Server running on ${host}:${port}`);
