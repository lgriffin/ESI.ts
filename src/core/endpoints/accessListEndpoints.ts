import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { AccessListSchema } from '../../schemas/access-lists';

export const accessListEndpoints = {
  getAccessList: {
    path: 'characters/{characterId}/access-lists/{accessListId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'accessListId'],
    responseSchema: AccessListSchema,
  },
  getCharacterAccessLists: {
    path: 'characters/{characterId}/access-lists',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(AccessListSchema),
  },
} as const satisfies EndpointMap;
