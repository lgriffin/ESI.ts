import { ApiClient } from '../core/ApiClient';
import { FactionWarfareLeaderboardsApi } from '../api/factions/getFactionWarfareLeaderboards';
import { FactionWarfareStatsApi } from '../api/factions/getFactionWarfareStats';
import { FactionWarfareSystemsApi } from '../api/factions/getFactionWarfareSystems';
import { FactionWarfareWarsApi } from '../api/factions/getFactionWarfareWars';

export class FactionClient {
    private factionWarfareLeaderboardsApi: FactionWarfareLeaderboardsApi;
    private factionWarfareStatsApi: FactionWarfareStatsApi;
    private factionWarfareSystemsApi: FactionWarfareSystemsApi;
    private factionWarfareWarsApi: FactionWarfareWarsApi;

    constructor(client: ApiClient) {
        this.factionWarfareLeaderboardsApi = new FactionWarfareLeaderboardsApi(client);
        this.factionWarfareStatsApi = new FactionWarfareStatsApi(client);
        this.factionWarfareSystemsApi = new FactionWarfareSystemsApi(client);
        this.factionWarfareWarsApi = new FactionWarfareWarsApi(client);
    }

    async getLeaderboardsCharacters(): Promise<any> {
        return await this.factionWarfareLeaderboardsApi.getCharacters();
    }

    async getLeaderboardsCorporations(): Promise<any> {
        return await this.factionWarfareLeaderboardsApi.getCorporations();
    }

    async getLeaderboardsOverall(): Promise<any> {
        return await this.factionWarfareLeaderboardsApi.getOverall();
    }

    async getStats(): Promise<any> {
        return await this.factionWarfareStatsApi.getStats();
    }

    async getCharacterStats(characterId: number): Promise<any> {
        return await this.factionWarfareStatsApi.getCharacterStats(characterId);
    }

    async getCorporationStats(corporationId: number): Promise<any> {
        return await this.factionWarfareStatsApi.getCorporationStats(corporationId);
    }

    async getSystems(): Promise<any> {
        return await this.factionWarfareSystemsApi.getSystems();
    }

    async getWars(): Promise<any> {
        return await this.factionWarfareWarsApi.getWars();
    }
}
