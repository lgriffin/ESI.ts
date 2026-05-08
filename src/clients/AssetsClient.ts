import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { assetEndpoints } from '../core/endpoints/assetEndpoints';
import {
  CharacterAsset,
  AssetLocation,
  AssetName,
} from '../types/api-responses';

export class AssetsClient extends BaseEsiClient<typeof assetEndpoints> {
  constructor(client: ApiClient) {
    super(client, assetEndpoints);
  }

  /**
   * Retrieve a list of assets owned by a character.
   *
   * @param characterId - The ID of the character whose assets to retrieve
   * @returns A list of the character's assets including type, quantity, and location
   * @requires Authentication
   */
  getCharacterAssets(characterId: number): Promise<CharacterAsset[]> {
    return this.api.getCharacterAssets(characterId) as Promise<
      CharacterAsset[]
    >;
  }

  /**
   * Look up the locations of specific assets owned by a character via a bulk POST request.
   *
   * @param characterId - The ID of the character who owns the assets
   * @param itemIds - An array of item IDs to look up locations for
   * @returns Location information for each requested asset
   * @requires Authentication
   */
  postCharacterAssetLocations(
    characterId: number,
    itemIds: number[],
  ): Promise<AssetLocation[]> {
    return this.api.postCharacterAssetLocations(
      characterId,
      itemIds,
    ) as Promise<AssetLocation[]>;
  }

  /**
   * Look up the names of specific assets owned by a character via a bulk POST request.
   *
   * @param characterId - The ID of the character who owns the assets
   * @param itemIds - An array of item IDs to look up names for
   * @returns The user-assigned names for each requested asset
   * @requires Authentication
   */
  postCharacterAssetNames(
    characterId: number,
    itemIds: number[],
  ): Promise<AssetName[]> {
    return this.api.postCharacterAssetNames(characterId, itemIds) as Promise<
      AssetName[]
    >;
  }

  /**
   * Retrieve a list of assets owned by a corporation.
   *
   * @param corporationId - The ID of the corporation whose assets to retrieve
   * @returns A list of the corporation's assets including type, quantity, and location
   * @requires Authentication
   */
  getCorporationAssets(corporationId: number): Promise<CharacterAsset[]> {
    return this.api.getCorporationAssets(corporationId) as Promise<
      CharacterAsset[]
    >;
  }

  /**
   * Look up the locations of specific assets owned by a corporation via a bulk POST request.
   *
   * @param corporationId - The ID of the corporation that owns the assets
   * @param itemIds - An array of item IDs to look up locations for
   * @returns Location information for each requested asset
   * @requires Authentication
   */
  postCorporationAssetLocations(
    corporationId: number,
    itemIds: number[],
  ): Promise<AssetLocation[]> {
    return this.api.postCorporationAssetLocations(
      corporationId,
      itemIds,
    ) as Promise<AssetLocation[]>;
  }

  /**
   * Look up the names of specific assets owned by a corporation via a bulk POST request.
   *
   * @param corporationId - The ID of the corporation that owns the assets
   * @param itemIds - An array of item IDs to look up names for
   * @returns The user-assigned names for each requested asset
   * @requires Authentication
   */
  postCorporationAssetNames(
    corporationId: number,
    itemIds: number[],
  ): Promise<AssetName[]> {
    return this.api.postCorporationAssetNames(
      corporationId,
      itemIds,
    ) as Promise<AssetName[]>;
  }
}
