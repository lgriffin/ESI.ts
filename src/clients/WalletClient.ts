import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { walletEndpoints } from '../core/endpoints/walletEndpoints';
import { WalletJournal, WalletTransaction } from '../types/api-responses';

export class WalletClient {
  private api: ReturnType<typeof createClient<typeof walletEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof walletEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, walletEndpoints);
  }

  /**
   * Retrieves the current ISK balance of a character's wallet.
   *
   * @param characterId - The ID of the character
   * @returns The character's wallet balance in ISK
   * @requires Authentication
   */
  getCharacterWallet(characterId: number): Promise<number> {
    return this.api.getCharacterWallet(characterId) as Promise<number>;
  }

  /**
   * Retrieves the wallet journal entries for a character, showing ISK transactions and their reasons.
   *
   * @param characterId - The ID of the character
   * @returns A list of wallet journal entries
   * @requires Authentication
   */
  getCharacterWalletJournal(characterId: number): Promise<WalletJournal[]> {
    return this.api.getCharacterWalletJournal(characterId) as Promise<
      WalletJournal[]
    >;
  }

  /**
   * Retrieves the market transaction history for a character's wallet.
   *
   * @param characterId - The ID of the character
   * @returns A list of market buy and sell transactions
   * @requires Authentication
   */
  getCharacterWalletTransactions(
    characterId: number,
  ): Promise<WalletTransaction[]> {
    return this.api.getCharacterWalletTransactions(characterId) as Promise<
      WalletTransaction[]
    >;
  }

  /**
   * Retrieves the balances for all wallet divisions of a corporation.
   *
   * @param corporationId - The ID of the corporation
   * @returns A list of wallet divisions with their balances
   * @requires Authentication
   */
  getCorporationWallets(
    corporationId: number,
  ): Promise<{ division: number; balance: number }[]> {
    return this.api.getCorporationWallets(corporationId) as Promise<
      { division: number; balance: number }[]
    >;
  }

  /**
   * Retrieves the wallet journal entries for a specific division of a corporation wallet.
   *
   * @param corporationId - The ID of the corporation
   * @param division - The wallet division number (1-7)
   * @returns A list of wallet journal entries for the specified division
   * @requires Authentication
   */
  getCorporationWalletJournal(
    corporationId: number,
    division: number,
  ): Promise<WalletJournal[]> {
    return this.api.getCorporationWalletJournal(
      corporationId,
      division,
    ) as Promise<WalletJournal[]>;
  }

  /**
   * Retrieves the market transaction history for a specific division of a corporation wallet.
   *
   * @param corporationId - The ID of the corporation
   * @param division - The wallet division number (1-7)
   * @returns A list of market buy and sell transactions for the specified division
   * @requires Authentication
   */
  getCorporationWalletTransactions(
    corporationId: number,
    division: number,
  ): Promise<WalletTransaction[]> {
    return this.api.getCorporationWalletTransactions(
      corporationId,
      division,
    ) as Promise<WalletTransaction[]>;
  }

  withMetadata(): WithMetadata<Omit<WalletClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, walletEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<WalletClient, 'withMetadata'>
    >;
  }
}
