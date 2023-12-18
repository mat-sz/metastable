import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Comfy } from '@metastable/comfy';
import type { Storage } from '@metastable/storage';

const promptBody = {
  type: 'object',
  properties: {
    project_id: {
      type: 'string',
    },
    models: {
      type: 'object',
      properties: {
        base: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        loras: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              strength: { type: 'number' },
            },
            required: ['name', 'strength'],
          },
        },
        controlnets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              strength: { type: 'number' },
              image: { type: 'string' },
            },
            required: ['name', 'strength', 'image'],
          },
        },
        upscale: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      required: ['base'],
    },
    conditioning: {
      type: 'object',
      properties: {
        positive: { type: 'string' },
        negative: { type: 'string' },
      },
      required: ['positive', 'negative'],
    },
    sampler: {
      type: 'object',
      properties: {
        seed: { type: 'number' },
        steps: { type: 'number' },
        cfg: { type: 'number' },
        denoise: { type: 'number' },
        sampler: { type: 'string' },
        scheduler: { type: 'string' },
        tiling: { type: 'boolean' },
        preview: {
          type: 'object',
          properties: {
            method: { type: 'string' },
          },
          required: ['method'],
        },
      },
      required: ['seed', 'steps', 'cfg', 'denoise', 'sampler', 'scheduler'],
    },
  },
  required: ['project_id', 'models', 'conditioning', 'sampler'],
} as const satisfies JSONSchema;

export function routesPrompts(comfy: Comfy, storage: Storage) {
  return async (fastify: FastifyInstance) => {
    fastify.post<{
      Body: FromSchema<typeof promptBody>;
    }>(
      '/',
      {
        schema: {
          body: promptBody,
        },
      },
      async request => {
        return await comfy.prompt(request.body, storage);
      },
    );
  };
}
