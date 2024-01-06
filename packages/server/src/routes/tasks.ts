import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

export function routesTasks(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
      return metastable.tasks.all();
    });

    fastify.get('/:queueId', async request => {
      const queueId = (request.params as any)?.queueId;
      return metastable.tasks.queue(queueId);
    });

    fastify.post('/:queueId/:taskId/cancel', async request => {
      const queueId = (request.params as any)?.queueId;
      const taskId = (request.params as any)?.taskId;
      metastable.tasks.cancel(queueId, taskId);
    });

    fastify.delete('/:queueId/:taskId', async request => {
      const queueId = (request.params as any)?.queueId;
      const taskId = (request.params as any)?.taskId;
      metastable.tasks.dismiss(queueId, taskId);
    });
  };
}
