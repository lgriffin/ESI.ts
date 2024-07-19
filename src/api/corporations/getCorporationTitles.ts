import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationTitlesApi {
    constructor(private client: ApiClient) {}

    async getCorporationTitles(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/titles`);
    }
}
