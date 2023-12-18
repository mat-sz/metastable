import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

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

export function routesModels(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
      return await metastable.storage.models.all();
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
        return await metastable.storage.models.update(
          modelType,
          modelName,
          request.body,
        );
      },
    );

    fastify.delete('/:type/:name', async request => {
      const modelName = (request.params as any)?.name;
      const modelType = (request.params as any)?.type;
      await metastable.storage.models.delete(modelType, modelName);
      return { ok: true };
    });
  };
}
