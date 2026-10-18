import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  CharacterAssetSchema,
  AssetLocationSchema,
  AssetNameSchema,
} from '../../schemas/assets';

export const assetEndpoints = {
  getCharacterAssets: fromOperation('GetCharactersCharacterIdAssets', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(CharacterAssetSchema),
  }),
  getCorporationAssets: fromOperation('GetCorporationsCorporationIdAssets', {
    trailingSlash: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(CharacterAssetSchema),
  }),
  postCharacterAssetLocations: fromOperation(
    'PostCharactersCharacterIdAssetsLocations',
    {
      trailingSlash: true,
      pathParams: ['characterId'],
      bodyBuilder: (itemIds: number[]) => itemIds,
      responseSchema: z.array(AssetLocationSchema),
    },
  ),
  postCharacterAssetNames: fromOperation(
    'PostCharactersCharacterIdAssetsNames',
    {
      trailingSlash: true,
      pathParams: ['characterId'],
      bodyBuilder: (itemIds: number[]) => itemIds,
      responseSchema: z.array(AssetNameSchema),
    },
  ),
  postCorporationAssetLocations: fromOperation(
    'PostCorporationsCorporationIdAssetsLocations',
    {
      trailingSlash: true,
      responseSchema: z.array(AssetLocationSchema),
      pathParams: ['corporationId'],
      bodyBuilder: (itemIds: number[]) => itemIds,
    },
  ),
  postCorporationAssetNames: fromOperation(
    'PostCorporationsCorporationIdAssetsNames',
    {
      trailingSlash: true,
      responseSchema: z.array(AssetNameSchema),
      pathParams: ['corporationId'],
      bodyBuilder: (itemIds: number[]) => itemIds,
    },
  ),
} as const satisfies EndpointMap;
