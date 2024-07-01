import { FactionWarfareLeaderboardsApi } from './getFactionWarfareLeaderboards';
import { FactionWarfareStatsApi } from './getFactionWarfareStats';
import { FactionWarfareSystemsApi } from './getFactionWarfareSystems';
import { FactionWarfareWarsApi } from './getFactionWarfareWars';

export class FactionClient {
    private factionWarfareLeaderboardsApi: FactionWarfareLeaderboardsApi;
    private factionWarfareStatsApi: FactionWarfareStatsApi;
    private factionWarfareSystemsApi: FactionWarfareSystemsApi;
    private factionWarfareWarsApi: FactionWarfareWarsApi;

    constructor(
        factionWarfareLeaderboardsApi: FactionWarfareLeaderboardsApi,
        factionWarfareStatsApi: FactionWarfareStatsApi,
        factionWarfareSystemsApi: FactionWarfareSystemsApi,
        factionWarfareWarsApi: FactionWarfareWarsApi
    ) {
        this.factionWarfareLeaderboardsApi = factionWarfareLeaderboardsApi;
        this.factionWarfareStatsApi = factionWarfareStatsApi;
        this.factionWarfareSystemsApi = factionWarfareSystemsApi;
        this.factionWarfareWarsApi = factionWarfareWarsApi;
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
