import { FastifyInstance } from 'fastify';
import { validateRequirements, type Comfy } from '@metastable/comfy';
import type { FileSystem } from '@metastable/fs-helpers';

export function routesInstance(comfy: Comfy, fileSystem: FileSystem) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/info', async () => {
      return {
        samplers: comfy.samplers,
        schedulers: comfy.schedulers,
        models: await fileSystem.allModels(),
      };
    });

    fastify.get('/compatibility', async () => {
      return await validateRequirements(comfy.python);
    });
  };
}
