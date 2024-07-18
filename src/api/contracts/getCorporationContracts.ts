import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationContractsApi {
    constructor(private client: ApiClient) {}

    async getCorporationContracts(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/contracts`);
    }
}
