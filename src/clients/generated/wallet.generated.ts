/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { walletEndpoints } from '../../core/endpoints/walletEndpoints';
import { WalletJournalSchema, WalletTransactionSchema } from '../../schemas/wallet';
import { CorporationWalletDivisionSchema } from '../../schemas/corporation';

export class GeneratedWalletClient extends BaseEsiClient<typeof walletEndpoints> {
  constructor(client: ApiClient) {
    super(client, walletEndpoints);
  }

  /**
   * GET getCharacterWallet
   * @requires Authentication
   */
  getCharacterWallet(characterId: number | string): Promise<unknown> {
    return this.api.getCharacterWallet(characterId) as Promise<unknown>;
  }

  /**
   * GET getCharacterWalletJournal
   * @requires Authentication
   */
  getCharacterWalletJournal(characterId: number | string): Promise<(z.infer<typeof WalletJournalSchema>)[]> {
    return this.api.getCharacterWalletJournal(characterId) as Promise<(z.infer<typeof WalletJournalSchema>)[]>;
  }

  /**
   * GET getCharacterWalletTransactions
   * @requires Authentication
   */
  getCharacterWalletTransactions(characterId: number | string): Promise<(z.infer<typeof WalletTransactionSchema>)[]> {
    return this.api.getCharacterWalletTransactions(characterId) as Promise<(z.infer<typeof WalletTransactionSchema>)[]>;
  }

  /**
   * GET getCorporationWallets
   * @requires Authentication
   */
  getCorporationWallets(corporationId: number | string): Promise<(z.infer<typeof CorporationWalletDivisionSchema>)[]> {
    return this.api.getCorporationWallets(corporationId) as Promise<(z.infer<typeof CorporationWalletDivisionSchema>)[]>;
  }

  /**
   * GET getCorporationWalletJournal
   * @requires Authentication
   */
  getCorporationWalletJournal(corporationId: number | string, division: number | string): Promise<(z.infer<typeof WalletJournalSchema>)[]> {
    return this.api.getCorporationWalletJournal(corporationId, division) as Promise<(z.infer<typeof WalletJournalSchema>)[]>;
  }

  /**
   * GET getCorporationWalletTransactions
   * @requires Authentication
   */
  getCorporationWalletTransactions(corporationId: number | string, division: number | string): Promise<(z.infer<typeof WalletTransactionSchema>)[]> {
    return this.api.getCorporationWalletTransactions(corporationId, division) as Promise<(z.infer<typeof WalletTransactionSchema>)[]>;
  }
}
