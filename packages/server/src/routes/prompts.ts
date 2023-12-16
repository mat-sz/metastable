import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Comfy } from '@metastable/comfy';
import { FileSystem } from '@metastable/fs-helpers';

const promptBody = {
  type: 'object',
  properties: {
    project_id: {
      type: 'number',
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

export function routesPrompts(
  prisma: PrismaClient,
  comfy: Comfy,
  fileSystem: FileSystem,
) {
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
        return await comfy.prompt(request.body, fileSystem);
      },
    );
  };
}
