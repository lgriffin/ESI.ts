import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { assetEndpoints } from '../core/endpoints/assetEndpoints';
import { CharacterAsset, AssetLocation, AssetName } from '../types/api-responses';

export class AssetsClient {
    private api: ReturnType<typeof createClient<typeof assetEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, assetEndpoints);
    }

    async getCharacterAssets(characterId: number): Promise<CharacterAsset[]> {
        return this.api.getCharacterAssets(characterId);
    }

    async postCharacterAssetLocations(characterId: number, itemIds: number[]): Promise<AssetLocation[]> {
        return this.api.postCharacterAssetLocations(characterId, itemIds);
    }

    async postCharacterAssetNames(characterId: number, itemIds: number[]): Promise<AssetName[]> {
        return this.api.postCharacterAssetNames(characterId, itemIds);
    }

    async getCorporationAssets(corporationId: number): Promise<CharacterAsset[]> {
        return this.api.getCorporationAssets(corporationId);
    }

    async postCorporationAssetLocations(corporationId: number, itemIds: number[]): Promise<AssetLocation[]> {
        return this.api.postCorporationAssetLocations(corporationId, itemIds);
    }

    async postCorporationAssetNames(corporationId: number, itemIds: number[]): Promise<AssetName[]> {
        return this.api.postCorporationAssetNames(corporationId, itemIds);
    }
}
