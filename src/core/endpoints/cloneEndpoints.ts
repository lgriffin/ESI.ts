import { EndpointMap } from './EndpointDefinition';

export const cloneEndpoints = {
  getClones: {
    path: 'characters/{characterId}/clones',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getImplants: {
    path: 'characters/{characterId}/implants',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
} as const satisfies EndpointMap;
