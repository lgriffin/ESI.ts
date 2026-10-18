import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  AccessListSchema,
  CharacterAccessListsResponseSchema,
} from '../../schemas/access-lists';

export const accessListEndpoints = {
  getAccessList: fromOperation('GetCharactersAccessListsDetail', {
    pathParams: ['characterId', 'accessListId'],
    responseSchema: AccessListSchema,
  }),
  getCharacterAccessLists: fromOperation('GetCharactersAccessListsListing', {
    pathParams: ['characterId'],
    responseSchema: CharacterAccessListsResponseSchema,
  }),
} as const satisfies EndpointMap;
