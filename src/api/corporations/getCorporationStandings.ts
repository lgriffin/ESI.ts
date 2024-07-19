import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationStandingsApi {
    constructor(private client: ApiClient) {}

    async getCorporationStandings(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/standings`);
    }
}
