import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

export function routesSetup(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/info', async () => {
      return await metastable.setup.info();
    });

    fastify.get('/details', async () => {
      return await metastable.setup.details();
    });
  };
}
