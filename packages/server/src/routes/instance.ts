import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

export function routesInstance(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/info', async () => {
      return await metastable.info();
    });
  };
}
