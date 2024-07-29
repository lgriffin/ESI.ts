import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationShareholdersApi {
    constructor(private client: ApiClient) {}

    async getCorporationShareholders(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/shareholders`, 'GET', undefined, true);
    }
}
