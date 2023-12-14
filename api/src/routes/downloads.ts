import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';

import type { Downloader } from '../modules/downloader.js';

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
        return await downloader.add(
          request.body.type,
          request.body.url,
          request.body.filename,
        );
      },
    );
  };
}
