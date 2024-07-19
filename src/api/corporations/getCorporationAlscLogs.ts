import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationAlscLogsApi {
    constructor(private client: ApiClient) {}

    async getCorporationAlscLogs(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/containers/logs`);
    }
}
