/**
 * What ESI's wallet endpoints send back in 0037-wallet.feature, and where.
 * Step files queue these; they do not build payloads or URLs themselves.
 */
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

export const WALLET_CHARACTER_ID = 1689391488;
export const BROKE_CHARACTER_ID = 123456789;
export const NEW_CHARACTER_ID = 111111111;
export const WALLET_CORPORATION_ID = 1344654522;
export const MASTER_DIVISION = 1;

export const FUNDED_BALANCE = 5250000000.75;

export const walletPaths = {
  balance: (characterId: number) => `/characters/${characterId}/wallet`,
  journal: (characterId: number) => `/characters/${characterId}/wallet/journal`,
  transactions: (characterId: number) =>
    `/characters/${characterId}/wallet/transactions`,
  corporationWallets: (corporationId: number) =>
    `/corporations/${corporationId}/wallets`,
  corporationJournal: (corporationId: number, division: number) =>
    `/corporations/${corporationId}/wallets/${division}/journal`,
  corporationTransactions: (corporationId: number, division: number) =>
    `/corporations/${corporationId}/wallets/${division}/transactions`,
};

/**
 * `/characters/{id}/wallet` is a prefix of the journal and transactions
 * paths, so the balance response is pinned to the end of the URL.
 */
export const balanceMatch = (characterId: number) =>
  new RegExp(`${walletPaths.balance(characterId)}$`);

/** The journal endpoints are paginated; one page is the whole journal. */
export const SINGLE_PAGE = { 'x-pages': '1' };

export const walletFixtures = {
  journal: () => [
    TestDataFactory.createWalletJournalEntry({
      id: 1000000001,
      date: '2024-01-15T12:00:00Z',
      ref_type: 'market_transaction',
      amount: 1000000.0,
      balance: 5250000000.75,
    }),
    TestDataFactory.createWalletJournalEntry({
      id: 1000000002,
      date: '2024-01-15T11:30:00Z',
      ref_type: 'bounty_prizes',
      first_party_id: 1000125,
      second_party_id: WALLET_CHARACTER_ID,
      amount: 500000.0,
      balance: 5249000000.75,
      reason: '11031: 2',
      description: 'CONCORD rewarded pilot for killing pirates',
    }),
  ],

  transactions: () => [
    TestDataFactory.createWalletTransaction({
      transaction_id: 123456789,
      date: '2024-01-15T12:00:00Z',
      type_id: 34,
      unit_price: 5.5,
      quantity: 1000,
      is_buy: false,
      journal_ref_id: 1000000001,
    }),
    TestDataFactory.createWalletTransaction({
      transaction_id: 123456790,
      date: '2024-01-15T11:00:00Z',
      type_id: 35,
      unit_price: 12.0,
      quantity: 500,
      is_buy: true,
      journal_ref_id: 1000000000,
    }),
  ],

  /** Seven divisions in division order, the last one empty. */
  corporationWallets: () =>
    [
      1000000000.0, 500000000.0, 250000000.0, 100000000.0, 50000000.0,
      25000000.0, 0,
    ].map((balance, index) =>
      TestDataFactory.createCorporationWallet({
        division: index + 1,
        balance,
      }),
    ),

  corporationJournal: () => [
    TestDataFactory.createWalletJournalEntry({
      id: 2000000001,
      ref_type: 'corporation_account_withdrawal',
      first_party_id: WALLET_CORPORATION_ID,
      second_party_id: WALLET_CHARACTER_ID,
      amount: -50000000.0,
      balance: 950000000.0,
      reason: 'SRP payout',
      description: 'Corporation withdrawal to pilot',
    }),
  ],

  corporationTransactions: () => [
    TestDataFactory.createWalletTransaction({
      transaction_id: 987654321,
      type_id: 34,
      unit_price: 5.5,
      quantity: 10000000,
      is_buy: true,
      is_personal: false,
    }),
  ],

  singleJournalEntry: () => [
    TestDataFactory.createWalletJournalEntry({
      id: 1000000001,
      amount: 1000000.0,
    }),
  ],

  singleTransaction: () => [
    TestDataFactory.createWalletTransaction({
      transaction_id: 123456789,
      unit_price: 5.5,
      quantity: 1000,
    }),
  ],

  /** Two incoming movements and one outgoing. */
  financialJournal: () => [
    TestDataFactory.createWalletJournalEntry({
      id: 1000000001,
      ref_type: 'market_transaction',
      amount: 1000000.0,
      balance: 5250000000.75,
    }),
    TestDataFactory.createWalletJournalEntry({
      id: 1000000002,
      ref_type: 'bounty_prizes',
      amount: 500000.0,
      balance: 5249000000.75,
      description: 'CONCORD rewarded pilot for killing pirates',
    }),
    TestDataFactory.createWalletJournalEntry({
      id: 1000000003,
      ref_type: 'market_transaction',
      amount: -200000.0,
      balance: 5248500000.75,
      description: 'Bought items on market',
    }),
  ],

  /** One sale, one purchase. */
  financialTransactions: () => [
    TestDataFactory.createWalletTransaction({
      transaction_id: 123456789,
      unit_price: 5.5,
      quantity: 1000,
      is_buy: false,
    }),
    TestDataFactory.createWalletTransaction({
      transaction_id: 123456790,
      unit_price: 12.0,
      quantity: 500,
      is_buy: true,
    }),
  ],
};
