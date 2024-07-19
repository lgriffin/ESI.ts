import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationDivisionsApi {
    constructor(private client: ApiClient) {}

    async getCorporationDivisions(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/divisions`);
    }
}
