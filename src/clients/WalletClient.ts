// src/clients/WalletClient.ts
import { GetCharacterWalletApi } from '../api/wallet/getCharacterWallet';
import { GetCharacterWalletJournalApi } from '../api/wallet/getCharacterWalletJournal';
import { GetCharacterWalletTransactionsApi } from '../api/wallet/getCharacterWalletTransactions';
import { GetCorporationWalletsApi } from '../api/wallet/getCorporationWallets';
import { GetCorporationWalletJournalApi } from '../api/wallet/getCorporationWalletJournal';
import { GetCorporationWalletTransactionsApi } from '../api/wallet/getCorporationWalletTransactions';
import { ApiClient } from '../core/ApiClient';

export class WalletClient {
    private getCharacterWalletApi: GetCharacterWalletApi;
    private getCharacterWalletJournalApi: GetCharacterWalletJournalApi;
    private getCharacterWalletTransactionsApi: GetCharacterWalletTransactionsApi;
    private getCorporationWalletsApi: GetCorporationWalletsApi;
    private getCorporationWalletJournalApi: GetCorporationWalletJournalApi;
    private getCorporationWalletTransactionsApi: GetCorporationWalletTransactionsApi;

    constructor(client: ApiClient) {
        this.getCharacterWalletApi = new GetCharacterWalletApi(client);
        this.getCharacterWalletJournalApi = new GetCharacterWalletJournalApi(client);
        this.getCharacterWalletTransactionsApi = new GetCharacterWalletTransactionsApi(client);
        this.getCorporationWalletsApi = new GetCorporationWalletsApi(client);
        this.getCorporationWalletJournalApi = new GetCorporationWalletJournalApi(client);
        this.getCorporationWalletTransactionsApi = new GetCorporationWalletTransactionsApi(client);
    }

    async getCharacterWallet(characterId: number): Promise<any> {
        return await this.getCharacterWalletApi.getCharacterWallet(characterId);
    }

    async getCharacterWalletJournal(characterId: number): Promise<any> {
        return await this.getCharacterWalletJournalApi.getCharacterWalletJournal(characterId);
    }

    async getCharacterWalletTransactions(characterId: number): Promise<any> {
        return await this.getCharacterWalletTransactionsApi.getCharacterWalletTransactions(characterId);
    }

    async getCorporationWallets(corporationId: number): Promise<any> {
        return await this.getCorporationWalletsApi.getCorporationWallets(corporationId);
    }

    async getCorporationWalletJournal(corporationId: number, division: number): Promise<any> {
        return await this.getCorporationWalletJournalApi.getCorporationWalletJournal(corporationId, division);
    }

    async getCorporationWalletTransactions(corporationId: number, division: number): Promise<any> {
        return await this.getCorporationWalletTransactionsApi.getCorporationWalletTransactions(corporationId, division);
    }
}
