import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class FactionWarfareStatsApi {
    constructor(private client: ApiClient) {}

    async getStats(): Promise<object> {
        return await handleRequest(this.client, 'fw/stats');
    }

    async getCharacterStats(characterId: number): Promise<object> {
        return await handleRequest(this.client, `characters/${characterId}/fw/stats`, true);
    }

    async getCorporationStats(corporationId: number): Promise<object> {
        return await handleRequest(this.client, `corporations/${corporationId}/fw/stats`, true);
    }
}
