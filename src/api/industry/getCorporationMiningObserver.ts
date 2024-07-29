import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMiningObserverApi {
    constructor(private client: ApiClient) {}

    async getCorporationMiningObserver(corporationId: number, observerId: number): Promise<any> {
        return handleRequest(this.client, `corporation/${corporationId}/mining/observers/${observerId}`, 'GET', undefined, true);
    }
}
