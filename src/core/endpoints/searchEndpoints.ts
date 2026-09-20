import { EndpointMap } from './EndpointDefinition';
import { SearchResultSchema } from '../../schemas/universe';

export const searchEndpoints = {
  searchCharacter: {
    path: 'characters/{characterId}/search/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { searchString: 'search', categories: 'categories' },
    responseSchema: SearchResultSchema,
  },
} as const satisfies EndpointMap;
