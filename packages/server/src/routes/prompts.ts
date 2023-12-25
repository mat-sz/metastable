import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

const promptBody = {
  type: 'object',
  properties: {
    input: {
      type: 'object',
      properties: {
        mode: { type: 'string' },
      },
      required: ['mode'],
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
              enabled: { type: 'boolean' },
              name: { type: 'string' },
              strength: { type: 'number' },
            },
            required: ['enabled', 'strength'],
          },
        },
        controlnets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              name: { type: 'string' },
              strength: { type: 'number' },
              image: { type: 'string' },
            },
            required: ['enabled', 'strength', 'image'],
          },
        },
        upscale: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            name: { type: 'string' },
          },
          required: ['enabled'],
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
  required: ['input', 'models', 'conditioning', 'sampler'],
} as const satisfies JSONSchema;

export function routesPrompts(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.post<{
      Body: FromSchema<typeof promptBody>;
    }>(
      '/:id',
      {
        schema: {
          body: promptBody,
        },
      },
      async request => {
        const projectId = (request.params as any)?.id;
        return await metastable.prompt(projectId, request.body as any);
      },
    );
  };
}
