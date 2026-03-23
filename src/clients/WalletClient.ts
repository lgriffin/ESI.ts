import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { walletEndpoints } from '../core/endpoints/walletEndpoints';
import { WalletJournal, WalletTransaction } from '../types/api-responses';

export class WalletClient {
    private api: ReturnType<typeof createClient<typeof walletEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, walletEndpoints);
    }

    async getCharacterWallet(characterId: number): Promise<number> {
        return this.api.getCharacterWallet(characterId);
    }

    async getCharacterWalletJournal(characterId: number): Promise<WalletJournal[]> {
        return this.api.getCharacterWalletJournal(characterId);
    }

    async getCharacterWalletTransactions(characterId: number): Promise<WalletTransaction[]> {
        return this.api.getCharacterWalletTransactions(characterId);
    }

    async getCorporationWallets(corporationId: number): Promise<{ division: number; balance: number }[]> {
        return this.api.getCorporationWallets(corporationId);
    }

    async getCorporationWalletJournal(corporationId: number, division: number): Promise<WalletJournal[]> {
        return this.api.getCorporationWalletJournal(corporationId, division);
    }

    async getCorporationWalletTransactions(corporationId: number, division: number): Promise<WalletTransaction[]> {
        return this.api.getCorporationWalletTransactions(corporationId, division);
    }
}
