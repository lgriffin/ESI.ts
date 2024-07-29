import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationAssetsApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async getCorporationAssets(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/assets/`, 'GET', undefined, true);
    }
}
