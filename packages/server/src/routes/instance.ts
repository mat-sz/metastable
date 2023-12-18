import { FastifyInstance } from 'fastify';
import { validateRequirements } from '@metastable/comfy';
import type { Metastable } from '@metastable/metastable';

export function routesInstance(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/info', async () => {
      return await metastable.info();
    });

    fastify.get('/compatibility', async () => {
      return await validateRequirements(metastable.python);
    });
  };
}
