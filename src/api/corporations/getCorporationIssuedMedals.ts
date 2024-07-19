import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationIssuedMedalsApi {
    constructor(private client: ApiClient) {}

    async getCorporationIssuedMedals(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/medals/issued`);
    }
}
