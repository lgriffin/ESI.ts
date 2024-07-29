import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetMoonExtractionTimersApi {
    constructor(private client: ApiClient) {}

    async getMoonExtractionTimers(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporation/${corporationId}/mining/extractions`, 'GET', undefined, true);
    }
}
