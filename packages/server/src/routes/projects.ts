import { JSONSchema, FromSchema } from 'json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

const projectBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    settings: { type: 'string' },
  },
} as const satisfies JSONSchema;

const projectBodyCreate = {
  ...projectBody,
  required: ['name', 'settings'],
} as const satisfies JSONSchema;

export function routesProjects(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
      return await metastable.storage.projects.all();
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
        return await metastable.storage.projects.create(request.body);
      },
    );

    fastify.get('/:id', async request => {
      const projectId = (request.params as any)?.id;
      return metastable.storage.projects.get(projectId);
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
        return await metastable.storage.projects.update(
          projectId,
          request.body,
        );
      },
    );

    fastify.delete('/:id', async request => {
      const projectId = (request.params as any)?.id;
      await metastable.storage.projects.delete(projectId);
      return { ok: true };
    });

    fastify.get('/:id/outputs', async request => {
      const projectId = (request.params as any)?.id;
      return await metastable.storage.projects.filenames(projectId, 'output');
    });
  };
}
