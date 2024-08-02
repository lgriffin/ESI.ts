import { ApiClient } from '../core/ApiClient';
import { GetCharacterLeaderboardsApi } from '../api/factions/getCharacterLeaderboards';
import { GetCorporationLeaderboardsApi } from '../api/factions/getCorporationLeaderboards';
import { GetFactionLeaderboardsApi } from '../api/factions/getFactionLeaderboards';
import { getFactionWarfareStats } from '../api/factions/getFactionWarfareStats';
import { GetCharacterFactionWarfareStatsApi } from '../api/factions/getCharacterFactionWarfareStats';
import { GetCorporationFactionWarfareStatsApi } from '../api/factions/getCorporationFactionWarfareStats';
import { FactionWarfareSystemsApi } from '../api/factions/getFactionWarfareSystems';
import { FactionWarfareWarsApi } from '../api/factions/getFactionWarfareWars';

export class FactionClient {
    private getCharacterLeaderboardsApi: GetCharacterLeaderboardsApi;
    private getCorporationLeaderboardsApi: GetCorporationLeaderboardsApi;
    private getFactionLeaderboardsApi: GetFactionLeaderboardsApi;
    private getFactionWarfareStatsApi: getFactionWarfareStats;
    private getCharacterFactionWarfareStatsApi: GetCharacterFactionWarfareStatsApi;
    private getCorporationFactionWarfareStatsApi: GetCorporationFactionWarfareStatsApi;
    private getFactionWarfareSystemsApi: FactionWarfareSystemsApi;
    private getFactionWarfareWarsApi: FactionWarfareWarsApi;

    constructor(client: ApiClient) {
        this.getCharacterLeaderboardsApi = new GetCharacterLeaderboardsApi(client);
        this.getCorporationLeaderboardsApi = new GetCorporationLeaderboardsApi(client);
        this.getFactionLeaderboardsApi = new GetFactionLeaderboardsApi(client);
        this.getFactionWarfareStatsApi = new getFactionWarfareStats(client);
        this.getCharacterFactionWarfareStatsApi = new GetCharacterFactionWarfareStatsApi(client);
        this.getCorporationFactionWarfareStatsApi = new GetCorporationFactionWarfareStatsApi(client);
        this.getFactionWarfareSystemsApi = new FactionWarfareSystemsApi(client);
        this.getFactionWarfareWarsApi = new FactionWarfareWarsApi(client);
    }

    async getLeaderboardsCharacters(): Promise<any> {
        return await this.getCharacterLeaderboardsApi.getCharacters();
    }

    async getLeaderboardsCorporations(): Promise<any> {
        return await this.getCorporationLeaderboardsApi.getCorporations();
    }

    async getLeaderboardsOverall(): Promise<any> {
        return await this.getFactionLeaderboardsApi.getOverall();
    }

    async getStats(): Promise<any> {
        return await this.getFactionWarfareStatsApi.getStats();
    }

    async getCharacterStats(characterId: number): Promise<any> {
        return await this.getCharacterFactionWarfareStatsApi.getCharacterStats(characterId);
    }

    async getCorporationStats(corporationId: number): Promise<any> {
        return await this.getCorporationFactionWarfareStatsApi.getCorporationStats(corporationId);
    }

    async getSystems(): Promise<any> {
        return await this.getFactionWarfareSystemsApi.getSystems();
    }

    async getWars(): Promise<any> {
        return await this.getFactionWarfareWarsApi.getWars();
    }
}
