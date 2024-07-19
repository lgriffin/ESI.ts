import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMedalsApi {
    constructor(private client: ApiClient) {}

    async getCorporationMedals(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/medals`);
    }
}
