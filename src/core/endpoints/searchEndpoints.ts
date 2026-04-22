import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const searchEndpoints = {
  searchCharacter: {
    path: 'characters/{characterId}/search/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { searchString: 'search' },
  },
} as const satisfies EndpointMap;
