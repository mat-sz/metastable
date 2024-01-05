import { FastifyInstance } from 'fastify';
import type { Metastable } from '@metastable/metastable';

export function routesTasks(metastable: Metastable) {
  return async (fastify: FastifyInstance) => {
    fastify.get('/', async () => {
      return metastable.getQueues();
    });

    fastify.get('/:queueId', async request => {
      const queueId = (request.params as any)?.queueId;
      return metastable.getTasks(queueId);
    });

    fastify.delete('/:queueId/:taskId', async request => {
      const queueId = (request.params as any)?.queueId;
      const taskId = (request.params as any)?.taskId;
      metastable.cancelTask(queueId, taskId);
    });
  };
}
