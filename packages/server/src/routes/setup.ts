import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

export function routesSetup(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/status', async () => {
      return await metastable.setup.status();
    });

    fastify.get('/details', async () => {
      return await metastable.setup.details();
    });
  };
}
