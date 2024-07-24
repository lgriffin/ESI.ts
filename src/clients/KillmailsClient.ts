import { ApiClient } from '../core/ApiClient';
import { GetCharacterRecentKillmailsApi } from '../api/killmails/getCharacterRecentKillmails';
import { GetCorporationRecentKillmailsApi } from '../api/killmails/getCorporationRecentKillmails';
import { GetKillmailApi } from '../api/killmails/getKillmail';

export class KillmailsClient {
    private getCharacterRecentKillmailsApi: GetCharacterRecentKillmailsApi;
    private getCorporationRecentKillmailsApi: GetCorporationRecentKillmailsApi;
    private getKillmailApi: GetKillmailApi;

    constructor(client: ApiClient) {
        this.getCharacterRecentKillmailsApi = new GetCharacterRecentKillmailsApi(client);
        this.getCorporationRecentKillmailsApi = new GetCorporationRecentKillmailsApi(client);
        this.getKillmailApi = new GetKillmailApi(client);
    }

    async getCharacterRecentKillmails(characterId: number): Promise<any> {
        return await this.getCharacterRecentKillmailsApi.getCharacterRecentKillmails(characterId);
    }

    async getCorporationRecentKillmails(corporationId: number): Promise<any> {
        return await this.getCorporationRecentKillmailsApi.getCorporationRecentKillmails(corporationId);
    }

    async getKillmail(killmailId: number, killmailHash: string): Promise<any> {
        return await this.getKillmailApi.getKillmail(killmailId, killmailHash);
    }
}
