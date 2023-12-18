import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Downloader } from '@metastable/downloader';
import type { Storage } from '@metastable/storage';
import { isPathIn } from '../../../fs-helpers/lib/index.js';

const downloadBody = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    type: { type: 'string' },
    name: { type: 'string' },
  },
  required: ['url', 'name', 'type'],
} as const satisfies JSONSchema;

export function routesDownloads(storage: Storage, downloader: Downloader) {
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
          const savePath = storage.models.path(
            request.body.type,
            request.body.name,
          );
          if (!isPathIn(storage.modelsDir, savePath)) {
            throw new Error(
              'Attempted to save file outside of the parent directory.',
            );
          }

          return await downloader.add(request.body.url, savePath);
        } catch (e) {
          return { error: (e as any).message };
        }
      },
    );

    fastify.delete('/:id', async request => {
      const downloadId = (request.params as any)?.id;
      downloader.cancel(downloadId);
    });
  };
}
