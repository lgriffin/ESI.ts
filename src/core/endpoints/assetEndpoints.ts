import { EndpointMap } from './EndpointDefinition';

export const assetEndpoints = {
  getCharacterAssets: {
    path: 'characters/{characterId}/assets/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCorporationAssets: {
    path: 'corporations/{corporationId}/assets/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  postCharacterAssetLocations: {
    path: 'characters/{characterId}/assets/locations/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    bodyBuilder: (itemIds: number[]) => itemIds,
  },
  postCharacterAssetNames: {
    path: 'characters/{characterId}/assets/names/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    bodyBuilder: (itemIds: number[]) => itemIds,
  },
  postCorporationAssetLocations: {
    path: 'corporations/{corporationId}/assets/locations/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['corporationId'],
    bodyBuilder: (itemIds: number[]) => itemIds,
  },
  postCorporationAssetNames: {
    path: 'corporations/{corporationId}/assets/names/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['corporationId'],
    bodyBuilder: (itemIds: number[]) => itemIds,
  },
} as const satisfies EndpointMap;
