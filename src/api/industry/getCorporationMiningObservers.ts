import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMiningObserversApi {
    constructor(private client: ApiClient) {}

    async getCorporationMiningObservers(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporation/${corporationId}/mining/observers`);
    }
}
