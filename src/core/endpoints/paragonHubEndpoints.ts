import { EndpointMap } from './EndpointDefinition';
import {
  ParagonHubSkinrResponseSchema,
  ParagonHubCharacterSkinrResponseSchema,
} from '../../schemas/paragon-hub';

export const paragonHubEndpoints = {
  getPublicListings: {
    path: 'paragon-hub/skinr',
    method: 'GET',
    requiresAuth: false,
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubSkinrResponseSchema,
  },
  getCharacterListings: {
    path: 'characters/{characterId}/paragon-hub/skinr',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubCharacterSkinrResponseSchema,
  },
  getAllianceListings: {
    path: 'paragon-hub/skinr/alliances/{allianceId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['allianceId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubSkinrResponseSchema,
  },
  getCharacterTargetedListings: {
    path: 'paragon-hub/skinr/characters/{characterId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubSkinrResponseSchema,
  },
  getCorporationListings: {
    path: 'paragon-hub/skinr/corporations/{corporationId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    responseSchema: ParagonHubSkinrResponseSchema,
  },
} as const satisfies EndpointMap;
