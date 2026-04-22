import { EndpointMap } from './EndpointDefinition';

export const walletEndpoints = {
  getCharacterWallet: {
    path: 'characters/{characterId}/wallet',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterWalletJournal: {
    path: 'characters/{characterId}/wallet/journal',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterWalletTransactions: {
    path: 'characters/{characterId}/wallet/transactions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCorporationWallets: {
    path: 'corporations/{corporationId}/wallets',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  getCorporationWalletJournal: {
    path: 'corporations/{corporationId}/wallets/{division}/journal',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'division'],
  },
  getCorporationWalletTransactions: {
    path: 'corporations/{corporationId}/wallets/{division}/transactions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'division'],
  },
} as const satisfies EndpointMap;
