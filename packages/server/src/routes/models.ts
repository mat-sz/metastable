import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

const modelBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    imageUrl: { type: 'string' },
    type: { type: 'string' },
    filename: { type: 'string' },
    source: { type: 'string' },
    sourceId: { type: 'string' },
  },
} as const satisfies JSONSchema;

const modelBodyCreate = {
  ...modelBody,
  required: ['name', 'type', 'filename'],
} as const satisfies JSONSchema;

const modelSelect = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  type: true,
  filename: true,
  source: true,
  sourceId: true,
  createdAt: true,
  updatedAt: true,
};

export function routesModels(prisma: PrismaClient) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
      return await prisma.model.findMany({
        select: modelSelect,
      });
    });

    fastify.post<{
      Body: FromSchema<typeof modelBodyCreate>;
    }>(
      '/',
      {
        schema: {
          body: modelBodyCreate,
        },
      },
      async request => {
        return await prisma.model.create({
          data: request.body,
          select: modelSelect,
        });
      },
    );

    fastify.get('/:id', async request => {
      const modelId = parseInt((request.params as any)?.id);
      return prisma.model.findFirst({
        select: modelSelect,
        where: { id: modelId },
      });
    });

    fastify.post<{ Body: FromSchema<typeof modelBody> }>(
      '/:id',
      {
        schema: {
          body: modelBody,
        },
      },
      async request => {
        const modelId = parseInt((request.params as any)?.id);
        return await prisma.model.update({
          where: { id: modelId },
          data: request.body,
          select: modelSelect,
        });
      },
    );

    fastify.delete('/:id', async request => {
      const modelId = parseInt((request.params as any)?.id);
      await prisma.model.delete({
        where: { id: modelId },
      });
      return { ok: true };
    });
  };
}
