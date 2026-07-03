import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  CharacterAssetSchema,
  AssetLocationSchema,
  AssetNameSchema,
} from '../../schemas/assets';

export const assetEndpoints = {
  getCharacterAssets: {
    path: 'characters/{characterId}/assets/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(CharacterAssetSchema),
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
    responseSchema: z.array(AssetLocationSchema),
  },
  postCharacterAssetNames: {
    path: 'characters/{characterId}/assets/names/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    bodyBuilder: (itemIds: number[]) => itemIds,
    responseSchema: z.array(AssetNameSchema),
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
