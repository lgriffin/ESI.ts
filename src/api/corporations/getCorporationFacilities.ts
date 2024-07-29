import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationFacilitiesApi {
    constructor(private client: ApiClient) {}

    async getCorporationFacilities(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/facilities`, 'GET', undefined, true);
    }
}
