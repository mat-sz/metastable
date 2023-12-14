import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Downloader } from '@metastable/downloader';

const downloadBody = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    type: { type: 'string' },
    filename: { type: 'string' },
  },
  required: ['url', 'filename', 'type'],
} as const satisfies JSONSchema;

export function routesDownloads(downloader: Downloader) {
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
          return await downloader.add(
            request.body.type,
            request.body.url,
            request.body.filename,
          );
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
