import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCharacterAssetLocationsApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async postCharacterAssetLocations(characterId: number, itemIds: number[]): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/assets/locations/`, 'POST', JSON.stringify({ item_ids: itemIds }),true);
    }
}
