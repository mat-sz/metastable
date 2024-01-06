import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

const downloadBody = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    type: { type: 'string' },
    name: { type: 'string' },
    imageUrl: { type: 'string' },
    info: { type: 'object' },
  },
  required: ['url', 'name', 'type'],
} as const satisfies JSONSchema;

export function routesDownloads(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.post<{ Body: FromSchema<typeof downloadBody> }>(
      '/',
      {
        schema: {
          body: downloadBody,
        },
      },
      async request => {
        try {
          return await metastable.downloadModel(request.body);
        } catch (e) {
          return { error: (e as any).message };
        }
      },
    );
  };
}
