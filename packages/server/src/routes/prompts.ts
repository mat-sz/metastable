import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import type { PrismaClient } from '@prisma/client';
import type { Comfy } from '@metastable/comfy';
import { exists } from '@metastable/fs-helpers';

import {
  createProjectTree,
  findModelByType,
  getModelPath,
  getModelsByType,
  getModelsDir,
  getProjectDataPath,
} from '../filesystem.js';

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

export function routesPrompts(prisma: PrismaClient, comfy: Comfy) {
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
        await createProjectTree(request.body.project_id);

        const settings = request.body;
        settings.models.base.path = getModelPath(
          'checkpoints',
          settings.models.base.name,
        );

        const embeddingsDir = getModelsDir('embeddings');
        if (await exists(embeddingsDir)) {
          settings.models.base.embedding_directory = embeddingsDir;
        }

        if (settings.models.loras) {
          for (const lora of settings.models.loras) {
            lora.path = getModelPath('loras', lora.name);
          }
        }

        if (settings.models.controlnets) {
          for (const controlnet of settings.models.controlnets) {
            controlnet.path = getModelPath('controlnet', controlnet.name);
          }
        }

        if (settings.sampler.preview?.method === 'taesd') {
          const list = await getModelsByType('vae_approx');
          settings.sampler.preview.taesd = {
            taesd_decoder: await findModelByType(list, 'taesd_decoder'),
            taesdxl_decoder: await findModelByType(list, 'taesdxl_decoder'),
          };
        }

        const id = nanoid();

        comfy.send('prompt', {
          ...request.body,
          id: id,
          output_path: getProjectDataPath(request.body.project_id, 'output'),
        });

        return { id };
      },
    );
  };
}
