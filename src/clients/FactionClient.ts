import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { factionEndpoints } from '../core/endpoints/factionEndpoints';
import { FactionWarfareStats, FactionWarfareCharacterStats, FactionWarfareSystem, FactionWarfareWar } from '../types/api-responses';

export class FactionClient {
    private api: ReturnType<typeof createClient<typeof factionEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, factionEndpoints);
    }

    async getLeaderboardsCharacters(): Promise<any> {
        return this.api.getCharacters();
    }

    async getLeaderboardsCorporations(): Promise<any> {
        return this.api.getCorporations();
    }

    async getLeaderboardsOverall(): Promise<any> {
        return this.api.getOverall();
    }

    async getStats(): Promise<FactionWarfareStats[]> {
        return this.api.getStats();
    }

    async getCharacterStats(characterId: number): Promise<FactionWarfareCharacterStats> {
        return this.api.getCharacterStats(characterId);
    }

    async getCorporationStats(corporationId: number): Promise<any> {
        return this.api.getCorporationStats(corporationId);
    }

    async getSystems(): Promise<FactionWarfareSystem[]> {
        return this.api.getSystems();
    }

    async getWars(): Promise<FactionWarfareWar[]> {
        return this.api.getWars();
    }
}
