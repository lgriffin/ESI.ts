import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  ParagonHubSkinrResponseSchema,
  ParagonHubCharacterSkinrResponseSchema,
} from '../../schemas/paragon-hub';

export const paragonHubEndpoints = {
  getPublicListings: fromOperation('GetParagonHubSkinr', {
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubSkinrResponseSchema,
  }),
  getCharacterListings: fromOperation('GetCharactersParagonHubSkinr', {
    pathParams: ['characterId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubCharacterSkinrResponseSchema,
  }),
  getAllianceListings: fromOperation('GetParagonHubSkinrAlliances', {
    pathParams: ['allianceId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubSkinrResponseSchema,
  }),
  getCharacterTargetedListings: fromOperation('GetParagonHubSkinrCharacters', {
    pathParams: ['characterId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubSkinrResponseSchema,
  }),
  getCorporationListings: fromOperation('GetParagonHubSkinrCorporations', {
    pathParams: ['corporationId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubSkinrResponseSchema,
  }),
} as const satisfies EndpointMap;
