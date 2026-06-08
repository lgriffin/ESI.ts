import { EndpointMap } from './EndpointDefinition';

export const accessListEndpoints = {
  getAccessList: {
    path: 'access-lists/{accessListId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['accessListId'],
  },
} as const satisfies EndpointMap;
