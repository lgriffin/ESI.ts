import { EndpointMap } from './EndpointDefinition';

export const fittingEndpoints = {
  getFittings: {
    path: 'characters/{characterId}/fittings',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  createFitting: {
    path: 'characters/{characterId}/fittings',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
  },
  deleteFitting: {
    path: 'characters/{characterId}/fittings/{fittingId}',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['characterId', 'fittingId'],
  },
} as const satisfies EndpointMap;
