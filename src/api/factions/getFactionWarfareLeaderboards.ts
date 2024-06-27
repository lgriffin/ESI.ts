import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/requestHandler';

export class FactionWarfareLeaderboardsApi {
    constructor(private client: ApiClient) {}

    async getCharacters(): Promise<object> {
        return await handleRequest(this.client, 'fw/leaderboards/characters');
    }

    async getCorporations(): Promise<object> {
        return await handleRequest(this.client, 'fw/leaderboards/corporations');
    }

    async getOverall(): Promise<object> {
        return await handleRequest(this.client, 'fw/leaderboards');
    }
}
