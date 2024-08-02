import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterLeaderboardsApi {
    constructor(private client: ApiClient) {}

    async getCharacters(): Promise<object> {
        return await handleRequest(this.client, 'fw/leaderboards/characters', 'GET',undefined,false);
    }
}
