import { EndpointMap } from './EndpointDefinition';
import { ServerStatusSchema } from '../../schemas/status';

export const statusEndpoints = {
  getStatus: {
    path: 'status',
    method: 'GET',
    requiresAuth: false,
    responseSchema: ServerStatusSchema,
  },
} as const satisfies EndpointMap;
