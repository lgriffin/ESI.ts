import { EndpointMap } from './EndpointDefinition';
import { CloneInfoSchema } from '../../schemas/clones';

export const cloneEndpoints = {
  getClones: {
    path: 'characters/{characterId}/clones',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CloneInfoSchema,
  },
  getImplants: {
    path: 'characters/{characterId}/implants',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
} as const satisfies EndpointMap;
