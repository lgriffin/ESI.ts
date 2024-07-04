import { ApiClient } from '../core/ApiClient';
import { WarsApi } from '../api/wars/getWars';
import { WarByIdApi } from '../api/wars/getWarById';
import { WarKillmailsApi } from '../api/wars/getWarKillmails';

export class WarsClient {
    private warsApi: WarsApi;
    private warByIdApi: WarByIdApi;
    private warKillmailsApi: WarKillmailsApi;

    constructor(client: ApiClient) {
        this.warsApi = new WarsApi(client);
        this.warByIdApi = new WarByIdApi(client);
        this.warKillmailsApi = new WarKillmailsApi(client);
    }

    async getWars(): Promise<any> {
        return await this.warsApi.getWars();
    }

    async getWarById(warId: number): Promise<any> {
        return await this.warByIdApi.getWarById(warId);
    }

    async getWarKillmails(warId: number): Promise<any> {
        return await this.warKillmailsApi.getWarKillmails(warId);
    }
}
