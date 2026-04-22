import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const statusEndpoints = {
  getStatus: {
    path: 'status',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
