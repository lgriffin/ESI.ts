/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { assetEndpoints } from '../../core/endpoints/assetEndpoints';
import { AssetLocationSchema, AssetNameSchema, CharacterAssetSchema } from '../../schemas/assets';

export class GeneratedAssetClient extends BaseEsiClient<typeof assetEndpoints> {
  constructor(client: ApiClient) {
    super(client, assetEndpoints);
  }

  /**
   * GET getCharacterAssets
   * @requires Authentication
   */
  getCharacterAssets(characterId: number | string): Promise<(z.infer<typeof CharacterAssetSchema>)[]> {
    return this.api.getCharacterAssets(characterId) as Promise<(z.infer<typeof CharacterAssetSchema>)[]>;
  }

  /**
   * GET getCorporationAssets
   * @requires Authentication
   */
  getCorporationAssets(corporationId: number | string): Promise<(z.infer<typeof CharacterAssetSchema>)[]> {
    return this.api.getCorporationAssets(corporationId) as Promise<(z.infer<typeof CharacterAssetSchema>)[]>;
  }

  /**
   * POST postCharacterAssetLocations
   * @requires Authentication
   */
  postCharacterAssetLocations(...args: Parameters<(typeof this.api)['postCharacterAssetLocations']>): Promise<(z.infer<typeof AssetLocationSchema>)[]> {
    return this.api.postCharacterAssetLocations(...args) as Promise<(z.infer<typeof AssetLocationSchema>)[]>;
  }

  /**
   * POST postCharacterAssetNames
   * @requires Authentication
   */
  postCharacterAssetNames(...args: Parameters<(typeof this.api)['postCharacterAssetNames']>): Promise<(z.infer<typeof AssetNameSchema>)[]> {
    return this.api.postCharacterAssetNames(...args) as Promise<(z.infer<typeof AssetNameSchema>)[]>;
  }

  /**
   * POST postCorporationAssetLocations
   * @requires Authentication
   */
  postCorporationAssetLocations(...args: Parameters<(typeof this.api)['postCorporationAssetLocations']>): Promise<unknown> {
    return this.api.postCorporationAssetLocations(...args) as Promise<unknown>;
  }

  /**
   * POST postCorporationAssetNames
   * @requires Authentication
   */
  postCorporationAssetNames(...args: Parameters<(typeof this.api)['postCorporationAssetNames']>): Promise<unknown> {
    return this.api.postCorporationAssetNames(...args) as Promise<unknown>;
  }
}
