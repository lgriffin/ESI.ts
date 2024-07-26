import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationCustomsOfficesApi {
    constructor(private client: ApiClient) {}

    async getCorporationCustomsOffices(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/customs_offices`);
    }
}
