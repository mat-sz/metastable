import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import createHttpError from 'http-errors';
import { FastifyInstance } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import type { PrismaClient } from '@prisma/client';
import { isPathIn } from '@metastable/fs-helpers';

import { projectsPath } from '../filesystem.js';

export const projectBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    settings: { type: 'string' },
  },
} as const satisfies JSONSchema;

export const projectBodyCreate = {
  ...projectBody,
  required: ['name'],
} as const satisfies JSONSchema;

export const projectSelect = {
  id: true,
  name: true,
  lastOutput: true,
  settings: true,
  createdAt: true,
  updatedAt: true,
};

export function routesProjects(prisma: PrismaClient) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
      return await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          lastOutput: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    fastify.post<{
      Body: FromSchema<typeof projectBodyCreate>;
    }>(
      '/',
      {
        schema: {
          body: projectBodyCreate,
        },
      },
      async request => {
        return await prisma.project.create({
          data: request.body,
          select: projectSelect,
        });
      },
    );

    fastify.get('/:id', async request => {
      const projectId = parseInt((request.params as any)?.id);
      return prisma.project.findFirst({
        select: projectSelect,
        where: { id: projectId },
      });
    });

    fastify.post<{ Body: FromSchema<typeof projectBody> }>(
      '/:id',
      {
        schema: {
          body: projectBody,
        },
      },
      async request => {
        const projectId = parseInt((request.params as any)?.id);
        return await prisma.project.update({
          where: { id: projectId },
          data: request.body,
          select: projectSelect,
        });
      },
    );

    fastify.delete('/:id', async request => {
      const projectId = parseInt((request.params as any)?.id);
      await prisma.project.delete({
        where: { id: projectId },
      });
      return { ok: true };
    });

    fastify.get('/:id/outputs', async request => {
      const projectId = parseInt((request.params as any)?.id);
      try {
        const files = await fs.readdir(
          path.join(projectsPath, `${projectId}`, 'output'),
        );
        return files;
      } catch {
        return [];
      }
    });

    fastify.get('/:id/outputs/:filename', async (request, reply) => {
      const projectId = parseInt((request.params as any)?.id);
      const fileName = (request.params as any)?.filename;
      const projectPath = path.join(projectsPath, `${projectId}`, 'output');
      const filePath = path.join(projectPath, fileName);
      if (!isPathIn(projectPath, filePath)) {
        return createHttpError(404);
      }

      return reply.sendFile(fileName, projectPath);
    });
  };
}
