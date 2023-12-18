import { FastifyInstance } from 'fastify';
import { validateRequirements, type Comfy } from '@metastable/comfy';
import type { Storage } from '@metastable/storage';

export function routesInstance(comfy: Comfy, storage: Storage) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/info', async () => {
      return {
        samplers: comfy.samplers,
        schedulers: comfy.schedulers,
        models: await storage.models.all(),
      };
    });

    fastify.get('/compatibility', async () => {
      return await validateRequirements(comfy.python);
    });
  };
}
