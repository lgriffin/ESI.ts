import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCorporationAssetNamesApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async postCorporationAssetNames(corporationId: number, itemIds: number[]): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/assets/names/`, 'POST', JSON.stringify({ item_ids: itemIds }));
    }
}
