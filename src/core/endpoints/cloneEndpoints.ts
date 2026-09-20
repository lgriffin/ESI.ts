import { z } from 'zod';
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
    responseSchema: z.array(z.number()),
  },
} as const satisfies EndpointMap;
