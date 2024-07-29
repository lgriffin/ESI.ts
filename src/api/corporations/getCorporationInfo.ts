import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationInfoApi {
    constructor(private client: ApiClient) {}

    async getCorporationInfo(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}`, 'GET', undefined, false);
    }
}
