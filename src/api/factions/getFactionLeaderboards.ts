import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetFactionLeaderboardsApi {
    constructor(private client: ApiClient) {}

    async getOverall(): Promise<object> {
        return await handleRequest(this.client, 'fw/leaderboards', 'GET', undefined, false);
    }
}
