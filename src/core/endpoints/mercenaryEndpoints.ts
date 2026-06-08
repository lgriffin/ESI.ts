import { EndpointMap } from './EndpointDefinition';

export const mercenaryEndpoints = {
  getMercenaryDens: {
    path: 'mercenary/dens',
    method: 'GET',
    requiresAuth: false,
  },
  getMercenaryTacticalOperations: {
    path: 'mercenary/operations',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
