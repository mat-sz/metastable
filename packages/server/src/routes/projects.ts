import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Storage } from '@metastable/storage';

export const projectBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    settings: { type: 'string' },
  },
} as const satisfies JSONSchema;

export const projectBodyCreate = {
  ...projectBody,
  required: ['name', 'settings'],
} as const satisfies JSONSchema;

export const projectSelect = {
  id: true,
  name: true,
  lastOutput: true,
  settings: true,
  createdAt: true,
  updatedAt: true,
};

export function routesProjects(storage: Storage) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
      return await storage.projects.all();
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
        return await storage.projects.create(request.body);
      },
    );

    fastify.get('/:id', async request => {
      const projectId = (request.params as any)?.id;
      return storage.projects.get(projectId);
    });

    fastify.post<{ Body: FromSchema<typeof projectBody> }>(
      '/:id',
      {
        schema: {
          body: projectBody,
        },
      },
      async request => {
        const projectId = (request.params as any)?.id;
        return await storage.projects.update(projectId, request.body);
      },
    );

    fastify.delete('/:id', async request => {
      const projectId = (request.params as any)?.id;
      await storage.projects.delete(projectId);
      return { ok: true };
    });

    fastify.get('/:id/outputs', async request => {
      const projectId = (request.params as any)?.id;
      return await storage.projects.filenames(projectId, 'output');
    });
  };
}
