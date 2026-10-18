import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { SearchResultSchema } from '../../schemas/universe';

export const searchEndpoints = {
  searchCharacter: fromOperation('GetCharactersCharacterIdSearch', {
    trailingSlash: true,
    pathParams: ['characterId'],
    queryParams: { searchString: 'search', categories: 'categories' },
    responseSchema: SearchResultSchema,
  }),
} as const satisfies EndpointMap;
