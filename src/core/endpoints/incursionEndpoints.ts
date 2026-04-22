import { EndpointMap } from './EndpointDefinition';

export const incursionEndpoints = {
  getIncursions: {
    path: 'incursions',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
