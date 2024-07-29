import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationIconApi {
    constructor(private client: ApiClient) {}

    async getCorporationIcon(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/icons`, 'GET', undefined, false);
    }
}
