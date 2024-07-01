import { WarsApi } from './getWars';
import { WarByIdApi } from './getWarById';
import { WarKillmailsApi } from './getWarKillmails';

export class WarsClient {
    constructor(
        private warsApi: WarsApi,
        private warByIdApi: WarByIdApi,
        private warKillmailsApi: WarKillmailsApi
    ) {}

    async getWars(): Promise<object[]> {
        return await this.warsApi.getWars();
    }

    async getWarById(warId: number): Promise<object> {
        return await this.warByIdApi.getWarById(warId);
    }

    async getWarKillmails(warId: number): Promise<object[]> {
        return await this.warKillmailsApi.getWarKillmails(warId);
    }
}
