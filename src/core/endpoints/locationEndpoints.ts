import { EndpointMap } from './EndpointDefinition';

export const locationEndpoints = {
  getCharacterLocation: {
    path: 'characters/{characterId}/location',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterOnline: {
    path: 'characters/{characterId}/online',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterShip: {
    path: 'characters/{characterId}/ship',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
} as const satisfies EndpointMap;
