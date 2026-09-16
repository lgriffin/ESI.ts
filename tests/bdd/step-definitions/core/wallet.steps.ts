import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0037-wallet.feature');

/**
 * `/characters/{id}/wallet` is a prefix of the journal and transactions
 * paths, so the balance response is pinned to the end of the URL.
 */
const balancePath = (characterId: number) =>
  new RegExp(`/characters/${characterId}/wallet$`);

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Funded wallet returns the ISK amount as a number', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character for wallet', () => {
      queueResponse({ match: balancePath(characterId), body: 5250000000.75 });
    });

    when('the client requests their wallet balance', async () => {
      result = await client.wallet.getCharacterWallet(characterId);
    });

    then('the client shall return the ISK amount', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe(`/characters/${characterId}/wallet`);
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(result).toBe(5250000000.75);
    });
  });

  test('Empty wallet returns zero', ({ given, when, then }) => {
    let result: any;
    const characterId = 123456789;

    given('a character with no ISK', () => {
      queueResponse({ match: balancePath(characterId), body: 0 });
    });

    when('the client requests the zero balance', async () => {
      result = await client.wallet.getCharacterWallet(characterId);
    });

    then('the client shall return zero', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toBe(0);
    });
  });

  test('Journal returns identifier, date, reference type, amount, and balance per entry', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character with transaction history', () => {
      queueResponse({
        match: `/characters/${characterId}/wallet/journal`,
        headers: { 'x-pages': '1' },
        body: [
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
            second_party_id: characterId,
            amount: 500000.0,
            balance: 5249000000.75,
            reason: '11031: 2',
            description: 'CONCORD rewarded pilot for killing pirates',
          }),
        ],
      });
    });

    when('the client requests their wallet journal', async () => {
      result = await client.wallet.getCharacterWalletJournal(characterId);
    });

    then('the client shall return journal entries', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/wallet/journal`,
      );
      expect(
        result.map((e: any) => ({
          id: e.id,
          date: e.date,
          ref_type: e.ref_type,
          amount: e.amount,
          balance: e.balance,
        })),
      ).toEqual([
        {
          id: 1000000001,
          date: '2024-01-15T12:00:00Z',
          ref_type: 'market_transaction',
          amount: 1000000.0,
          balance: 5250000000.75,
        },
        {
          id: 1000000002,
          date: '2024-01-15T11:30:00Z',
          ref_type: 'bounty_prizes',
          amount: 500000.0,
          balance: 5249000000.75,
        },
      ]);
    });
  });

  test('New character with no movements returns an empty journal array', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 111111111;

    given('a new character with no activity', () => {
      queueResponse({
        match: `/characters/${characterId}/wallet/journal`,
        headers: { 'x-pages': '1' },
        body: [],
      });
    });

    when('the client requests the new character wallet journal', async () => {
      result = await client.wallet.getCharacterWalletJournal(characterId);
    });

    then('the client shall return an empty journal array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('Transactions return unit price, quantity, and buy flag per record', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character with market activity', () => {
      queueResponse({
        match: `/characters/${characterId}/wallet/transactions`,
        body: [
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
      });
    });

    when('the client requests their transactions', async () => {
      result = await client.wallet.getCharacterWalletTransactions(characterId);
    });

    then('the client shall return transaction records', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/wallet/transactions`,
      );
      expect(
        result.map((t: any) => [
          t.transaction_id,
          t.type_id,
          t.unit_price,
          t.quantity,
          t.is_buy,
        ]),
      ).toEqual([
        [123456789, 34, 5.5, 1000, false],
        [123456790, 35, 12.0, 500, true],
      ]);
    });
  });

  test('Seven corporation divisions return their division numbers and balances', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;
    const balances = [
      1000000000.0, 500000000.0, 250000000.0, 100000000.0, 50000000.0,
      25000000.0, 0,
    ];

    given('an authenticated director', () => {
      queueResponse({
        match: `/corporations/${corporationId}/wallets`,
        body: balances.map((balance, index) =>
          TestDataFactory.createCorporationWallet({
            division: index + 1,
            balance,
          }),
        ),
      });
    });

    when('the client requests corporation wallets', async () => {
      result = await client.wallet.getCorporationWallets(corporationId);
    });

    then('the client shall return all wallet divisions', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${corporationId}/wallets`,
      );
      expect(result).toEqual([
        { division: 1, balance: 1000000000.0 },
        { division: 2, balance: 500000000.0 },
        { division: 3, balance: 250000000.0 },
        { division: 4, balance: 100000000.0 },
        { division: 5, balance: 50000000.0 },
        { division: 6, balance: 25000000.0 },
        { division: 7, balance: 0 },
      ]);
    });
  });

  test('Division 1 journal returns entries booked to that division', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;
    const division = 1;

    given('an authenticated director for journal', () => {
      queueResponse({
        match: `/corporations/${corporationId}/wallets/${division}/journal`,
        headers: { 'x-pages': '1' },
        body: [
          TestDataFactory.createWalletJournalEntry({
            id: 2000000001,
            ref_type: 'corporation_account_withdrawal',
            first_party_id: corporationId,
            second_party_id: 1689391488,
            amount: -50000000.0,
            balance: 950000000.0,
            reason: 'SRP payout',
            description: 'Corporation withdrawal to pilot',
          }),
        ],
      });
    });

    when('the client requests the journal for division 1', async () => {
      result = await client.wallet.getCorporationWalletJournal(
        corporationId,
        division,
      );
    });

    then('the client shall return journal entries for that division', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${corporationId}/wallets/${division}/journal`,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 2000000001,
        ref_type: 'corporation_account_withdrawal',
        amount: -50000000.0,
        balance: 950000000.0,
      });
    });
  });

  test('Division 1 transactions return records booked to that division', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;
    const division = 1;

    given('an authenticated director for transactions', () => {
      queueResponse({
        match: `/corporations/${corporationId}/wallets/${division}/transactions`,
        body: [
          TestDataFactory.createWalletTransaction({
            transaction_id: 987654321,
            type_id: 34,
            unit_price: 5.5,
            quantity: 10000000,
            is_buy: true,
            is_personal: false,
          }),
        ],
      });
    });

    when('the client requests transactions for division 1', async () => {
      result = await client.wallet.getCorporationWalletTransactions(
        corporationId,
        division,
      );
    });

    then('the client shall return corporation transaction records', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${corporationId}/wallets/${division}/transactions`,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        transaction_id: 987654321,
        type_id: 34,
        unit_price: 5.5,
        quantity: 10000000,
        is_buy: true,
      });
    });
  });

  test('Character wallet request without a token rejects with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;
    const characterId = 1689391488;

    given('an unauthenticated user for character wallet', () => {
      // The token is present but does not carry the wallet scope, so ESI
      // refuses it. 403 is not retryable: exactly one request goes out.
      queueError(403, 'Token not valid for scope(s)', {
        match: balancePath(characterId),
      });
    });

    when(
      'the client requests a character wallet balance without auth',
      async () => {
        try {
          await client.wallet.getCharacterWallet(characterId);
        } catch (e) {
          caughtError = e;
        }
      },
    );

    then(
      'the client shall return a 403 forbidden error for character wallet',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(403);
        expect(sentRequests()).toHaveLength(1);
      },
    );
  });

  test('Corporation wallet request without director rights rejects with an EsiError', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;
    const corporationId = 1344654522;

    given('a non-director character for corporation wallet', () => {
      queueError(403, 'Character does not have required role(s)', {
        match: `/corporations/${corporationId}/wallets`,
      });
    });

    when('the client requests corporation wallets without auth', async () => {
      try {
        await client.wallet.getCorporationWallets(corporationId);
      } catch (e) {
        caughtError = e;
      }
    });

    then(
      'the client shall return a 403 forbidden error for corporation wallet',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(403);
        expect(sentRequests()).toHaveLength(1);
      },
    );
  });

  test('Concurrent balance, journal, and transaction calls each resolve independently', ({
    given,
    when,
    then,
  }) => {
    let balance: any;
    let journal: any;
    let transactions: any;
    const characterId = 1689391488;

    given('an authenticated character for concurrent wallet ops', () => {
      // Staggered delays make responses arrive out of request order.
      queueResponse({
        match: balancePath(characterId),
        body: 5250000000.75,
        delayMs: 30,
      });
      queueResponse({
        match: `/characters/${characterId}/wallet/journal`,
        headers: { 'x-pages': '1' },
        body: [
          TestDataFactory.createWalletJournalEntry({
            id: 1000000001,
            amount: 1000000.0,
          }),
        ],
        delayMs: 15,
      });
      queueResponse({
        match: `/characters/${characterId}/wallet/transactions`,
        body: [
          TestDataFactory.createWalletTransaction({
            transaction_id: 123456789,
            unit_price: 5.5,
            quantity: 1000,
          }),
        ],
      });
    });

    when(
      'the client fetches balance, journal, and transactions concurrently',
      async () => {
        [balance, journal, transactions] = await Promise.all([
          client.wallet.getCharacterWallet(characterId),
          client.wallet.getCharacterWalletJournal(characterId),
          client.wallet.getCharacterWalletTransactions(characterId),
        ]);
      },
    );

    then('all wallet data shall complete successfully', () => {
      expect(sentRequests()).toHaveLength(3);
      expect(balance).toBe(5250000000.75);
      expect(journal.map((e: any) => e.id)).toEqual([1000000001]);
      expect(journal[0].amount).toBe(1000000.0);
      expect(transactions.map((t: any) => t.transaction_id)).toEqual([
        123456789,
      ]);
    });
  });

  test('Journal amounts and buy flags total into income, expenditure, and trade counts', ({
    given,
    when,
    then,
  }) => {
    let balance: any;
    let journal: any;
    let transactions: any;
    const characterId = 1689391488;

    given('an authenticated character with financial history', () => {
      queueResponse({ match: balancePath(characterId), body: 5250000000.75 });
      queueResponse({
        match: `/characters/${characterId}/wallet/journal`,
        headers: { 'x-pages': '1' },
        body: [
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
      });
      queueResponse({
        match: `/characters/${characterId}/wallet/transactions`,
        body: [
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
      });
    });

    when('the client gathers all financial data', async () => {
      [balance, journal, transactions] = await Promise.all([
        client.wallet.getCharacterWallet(characterId),
        client.wallet.getCharacterWalletJournal(characterId),
        client.wallet.getCharacterWalletTransactions(characterId),
      ]);
    });

    then('the client shall compute a financial summary', () => {
      const totalIncome = journal
        .filter((entry: any) => entry.amount > 0)
        .reduce((sum: number, entry: any) => sum + entry.amount, 0);
      const totalExpenses = journal
        .filter((entry: any) => entry.amount < 0)
        .reduce((sum: number, entry: any) => sum + Math.abs(entry.amount), 0);
      const buyTransactions = transactions.filter(
        (t: any) => t.is_buy === true,
      );
      const sellTransactions = transactions.filter(
        (t: any) => t.is_buy === false,
      );

      expect(balance).toBe(5250000000.75);
      expect(totalIncome).toBe(1500000.0);
      expect(totalExpenses).toBe(200000.0);
      expect(buyTransactions.map((t: any) => t.transaction_id)).toEqual([
        123456790,
      ]);
      expect(sellTransactions.map((t: any) => t.transaction_id)).toEqual([
        123456789,
      ]);
    });
  });
});
