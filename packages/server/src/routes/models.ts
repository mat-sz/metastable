import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Storage } from '@metastable/storage';

const modelBody = {
  type: 'object',
  properties: {
    longName: { type: 'string' },
    description: { type: 'string' },
    source: { type: 'string' },
    sourceId: { type: 'string' },
    nsfw: { type: 'boolean' },
  },
} as const satisfies JSONSchema;

export function routesModels(storage: Storage) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
      return await storage.models.all();
    });

    fastify.post<{ Body: FromSchema<typeof modelBody> }>(
      '/:type/:name',
      {
        schema: {
          body: modelBody,
        },
      },
      async request => {
        const modelName = (request.params as any)?.name;
        const modelType = (request.params as any)?.type;
        return await storage.models.update(modelType, modelName, request.body);
      },
    );

    fastify.delete('/:type/:name', async request => {
      const modelName = (request.params as any)?.name;
      const modelType = (request.params as any)?.type;
      await storage.models.delete(modelType, modelName);
      return { ok: true };
    });
  };
}
