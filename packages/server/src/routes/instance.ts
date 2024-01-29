import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

export function routesInstance(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/info', async () => {
      return await metastable.info();
    });

    fastify.get('/config', async () => {
      return await metastable.storage.config.all();
    });

    fastify.post('/config', async request => {
      const data = request.body as any;
      if (typeof data === 'object') {
        await metastable.storage.config.store(data);
      }
      return await metastable.storage.config.all();
    });
  };
}
