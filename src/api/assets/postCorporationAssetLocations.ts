import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCorporationAssetLocationsApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async postCorporationAssetLocations(corporationId: number, itemIds: number[]): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/assets/locations/`, 'POST', JSON.stringify({ item_ids: itemIds }));
    }
}
