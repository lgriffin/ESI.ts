import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterFactionWarfareStatsApi {
    constructor(private client: ApiClient) {}

    async getCharacterStats(characterId: number): Promise<object> {
        return await handleRequest(this.client, `characters/${characterId}/fw/stats`, 'GET', undefined, true);
    }
}
