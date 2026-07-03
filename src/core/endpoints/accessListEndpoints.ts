import { EndpointMap } from './EndpointDefinition';
import { AccessListSchema } from '../../schemas/access-lists';

export const accessListEndpoints = {
  getAccessList: {
    path: 'access-lists/{accessListId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['accessListId'],
    responseSchema: AccessListSchema,
  },
} as const satisfies EndpointMap;
