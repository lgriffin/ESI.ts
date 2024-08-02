import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationLeaderboardsApi {
    constructor(private client: ApiClient) {}

    async getCorporations(): Promise<object> {
        return await handleRequest(this.client, 'fw/leaderboards/corporations', 'GET', undefined, false);
    }
}
