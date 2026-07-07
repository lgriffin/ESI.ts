import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  WalletJournalSchema,
  WalletTransactionSchema,
} from '../../schemas/wallet';
import { CorporationWalletDivisionSchema } from '../../schemas/corporation';

export const walletEndpoints = {
  getCharacterWallet: {
    path: 'characters/{characterId}/wallet',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.number(),
  },
  getCharacterWalletJournal: {
    path: 'characters/{characterId}/wallet/journal',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(WalletJournalSchema),
  },
  getCharacterWalletTransactions: {
    path: 'characters/{characterId}/wallet/transactions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(WalletTransactionSchema),
  },
  getCorporationWallets: {
    path: 'corporations/{corporationId}/wallets',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(CorporationWalletDivisionSchema),
  },
  getCorporationWalletJournal: {
    path: 'corporations/{corporationId}/wallets/{division}/journal',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'division'],
    responseSchema: z.array(WalletJournalSchema),
  },
  getCorporationWalletTransactions: {
    path: 'corporations/{corporationId}/wallets/{division}/transactions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'division'],
    responseSchema: z.array(WalletTransactionSchema),
  },
} as const satisfies EndpointMap;
