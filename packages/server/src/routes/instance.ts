import { FastifyInstance } from 'fastify';
import type { Comfy } from '@metastable/comfy';

import { getModels } from '../filesystem.js';

export function routesInstance(comfy: Comfy) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/info', async () => {
      return {
        samplers: comfy.samplers,
        schedulers: comfy.schedulers,
        models: await getModels(),
      };
    });
  };
}
