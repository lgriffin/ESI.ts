import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMemberTrackingApi {
    constructor(private client: ApiClient) {}

    async getCorporationMemberTracking(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/membertracking`, 'GET', undefined, true);
    }
}
