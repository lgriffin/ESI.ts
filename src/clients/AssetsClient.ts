import { ApiClient } from '../core/ApiClient';
import { GetCharacterAssetsApi } from '../api/assets/getCharacterAssets';
import { PostCharacterAssetLocationsApi } from '../api/assets/postCharacterAssetLocations';
import { PostCharacterAssetNamesApi } from '../api/assets/postCharacterAssetNames';
import { GetCorporationAssetsApi } from '../api/assets/getCorporationAssets';
import { PostCorporationAssetLocationsApi } from '../api/assets/postCorporationAssetLocations';
import { PostCorporationAssetNamesApi } from '../api/assets/postCorporationAssetNames';

export class AssetsClient {
    private getCharacterAssetsApi: GetCharacterAssetsApi;
    private postCharacterAssetLocationsApi: PostCharacterAssetLocationsApi;
    private postCharacterAssetNamesApi: PostCharacterAssetNamesApi;
    private getCorporationAssetsApi: GetCorporationAssetsApi;
    private postCorporationAssetLocationsApi: PostCorporationAssetLocationsApi;
    private postCorporationAssetNamesApi: PostCorporationAssetNamesApi;

    constructor(client: ApiClient) {
        this.getCharacterAssetsApi = new GetCharacterAssetsApi(client);
        this.postCharacterAssetLocationsApi = new PostCharacterAssetLocationsApi(client);
        this.postCharacterAssetNamesApi = new PostCharacterAssetNamesApi(client);
        this.getCorporationAssetsApi = new GetCorporationAssetsApi(client);
        this.postCorporationAssetLocationsApi = new PostCorporationAssetLocationsApi(client);
        this.postCorporationAssetNamesApi = new PostCorporationAssetNamesApi(client);
    }

    async getCharacterAssets(characterId: number): Promise<any> {
        return await this.getCharacterAssetsApi.getCharacterAssets(characterId);
    }

    async postCharacterAssetLocations(characterId: number, itemIds: number[]): Promise<any> {
        return await this.postCharacterAssetLocationsApi.postCharacterAssetLocations(characterId, itemIds);
    }

    async postCharacterAssetNames(characterId: number, itemIds: number[]): Promise<any> {
        return await this.postCharacterAssetNamesApi.postCharacterAssetNames(characterId, itemIds);
    }

    async getCorporationAssets(corporationId: number): Promise<any> {
        return await this.getCorporationAssetsApi.getCorporationAssets(corporationId);
    }

    async postCorporationAssetLocations(corporationId: number, itemIds: number[]): Promise<any> {
        return await this.postCorporationAssetLocationsApi.postCorporationAssetLocations(corporationId, itemIds);
    }

    async postCorporationAssetNames(corporationId: number, itemIds: number[]): Promise<any> {
        return await this.postCorporationAssetNamesApi.postCorporationAssetNames(corporationId, itemIds);
    }
}
