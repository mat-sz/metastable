import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';

const setupBody = {
  type: 'object',
  properties: {
    downloads: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          url: { type: 'string' },
        },
        required: ['name', 'type', 'url'],
      },
    },
    pythonMode: {
      type: 'string',
    },
  },
  required: ['downloads', 'pythonMode'],
} as const satisfies JSONSchema;

export function routesSetup(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/status', async () => {
      return await metastable.setup.status();
    });

    fastify.get('/details', async () => {
      return await metastable.setup.details();
    });

    fastify.post<{
      Body: FromSchema<typeof setupBody>;
    }>(
      '/start',
      {
        schema: {
          body: setupBody,
        },
      },
      async request => {
        return await metastable.setup.start(request.body as any);
      },
    );
  };
}
