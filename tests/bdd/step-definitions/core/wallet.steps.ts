import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/wallet.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-wallet-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Get ISK balance for a character', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character for wallet', () => {
      const expectedBalance = 5250000000.75;

      jest
        .spyOn(client.wallet, 'getCharacterWallet')
        .mockResolvedValue(expectedBalance);
    });

    when('I request their wallet balance', async () => {
      result = await client.wallet.getCharacterWallet(characterId);
    });

    then('I should receive the ISK amount', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(result).toBe(5250000000.75);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  test('Character with zero ISK balance', ({ given, when, then }) => {
    let result: any;
    const characterId = 123456789;

    given('a character with no ISK', () => {
      jest.spyOn(client.wallet, 'getCharacterWallet').mockResolvedValue(0);
    });

    when('I request the zero balance', async () => {
      result = await client.wallet.getCharacterWallet(characterId);
    });

    then('I should receive zero', () => {
      expect(result).toBe(0);
      expect(typeof result).toBe('number');
    });
  });

  test('Get journal entries for a character', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character with transaction history', () => {
      const expectedJournal = [
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
          amount: 500000.0,
          balance: 5249000000.75,
        }),
      ];

      jest
        .spyOn(client.wallet, 'getCharacterWalletJournal')
        .mockResolvedValue(expectedJournal);
    });

    when('I request their wallet journal', async () => {
      result = await client.wallet.getCharacterWalletJournal(characterId);
    });

    then('I should receive journal entries', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('ref_type');
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('balance');
      expect(typeof result[0].amount).toBe('number');
    });
  });

  test('Empty journal for a new character', ({ given, when, then }) => {
    let result: any;
    const characterId = 111111111;

    given('a new character with no activity', () => {
      jest
        .spyOn(client.wallet, 'getCharacterWalletJournal')
        .mockResolvedValue([]);
    });

    when('I request the new character wallet journal', async () => {
      result = await client.wallet.getCharacterWalletJournal(characterId);
    });

    then('I should receive an empty journal array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });

  test('Get market transactions for a character', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character with market activity', () => {
      const expectedTransactions = [
        TestDataFactory.createWalletTransaction({
          transaction_id: 123456789,
          date: '2024-01-15T12:00:00Z',
          type_id: 34,
          unit_price: 5.5,
          quantity: 1000,
          is_buy: false,
        }),
        TestDataFactory.createWalletTransaction({
          transaction_id: 123456790,
          date: '2024-01-15T11:00:00Z',
          type_id: 35,
          unit_price: 12.0,
          quantity: 500,
          is_buy: true,
        }),
      ];

      jest
        .spyOn(client.wallet, 'getCharacterWalletTransactions')
        .mockResolvedValue(expectedTransactions);
    });

    when('I request their transactions', async () => {
      result = await client.wallet.getCharacterWalletTransactions(characterId);
    });

    then('I should receive transaction records', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('transaction_id');
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('unit_price');
      expect(result[0]).toHaveProperty('quantity');
      expect(result[0]).toHaveProperty('is_buy');
      expect(typeof result[0].unit_price).toBe('number');
      expect(typeof result[0].quantity).toBe('number');
    });
  });

  test('Get corporation wallet divisions', ({ given, when, then }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated director', () => {
      const expectedWallets = [
        TestDataFactory.createCorporationWallet({
          division: 1,
          balance: 1000000000.0,
        }),
        TestDataFactory.createCorporationWallet({
          division: 2,
          balance: 500000000.0,
        }),
        TestDataFactory.createCorporationWallet({
          division: 3,
          balance: 250000000.0,
        }),
        TestDataFactory.createCorporationWallet({
          division: 4,
          balance: 100000000.0,
        }),
        TestDataFactory.createCorporationWallet({
          division: 5,
          balance: 50000000.0,
        }),
        TestDataFactory.createCorporationWallet({
          division: 6,
          balance: 25000000.0,
        }),
        TestDataFactory.createCorporationWallet({
          division: 7,
          balance: 10000000.0,
        }),
      ];

      jest
        .spyOn(client.wallet, 'getCorporationWallets')
        .mockResolvedValue(expectedWallets);
    });

    when('I request corporation wallets', async () => {
      result = await client.wallet.getCorporationWallets(corporationId);
    });

    then('I should receive all wallet divisions', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(7);
      result.forEach((wallet: any, index: number) => {
        expect(wallet).toHaveProperty('division');
        expect(wallet).toHaveProperty('balance');
        expect(wallet.division).toBe(index + 1);
        expect(typeof wallet.balance).toBe('number');
      });
    });
  });

  test('Get corporation wallet journal for a specific division', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;
    const division = 1;

    given('an authenticated director for journal', () => {
      const expectedJournal = [
        TestDataFactory.createWalletJournalEntry({
          id: 2000000001,
          ref_type: 'corporation_account_withdrawal',
          amount: -50000000.0,
          balance: 950000000.0,
        }),
      ];

      jest
        .spyOn(client.wallet, 'getCorporationWalletJournal')
        .mockResolvedValue(expectedJournal);
    });

    when('I request the journal for division 1', async () => {
      result = await client.wallet.getCorporationWalletJournal(
        corporationId,
        division,
      );
    });

    then('I should receive journal entries for that division', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('ref_type');
      expect(result[0]).toHaveProperty('amount');
    });
  });

  test('Get corporation wallet transactions for a specific division', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;
    const division = 1;

    given('an authenticated director for transactions', () => {
      const expectedTransactions = [
        TestDataFactory.createWalletTransaction({
          transaction_id: 987654321,
          type_id: 34,
          unit_price: 5.5,
          quantity: 10000000,
          is_buy: true,
        }),
      ];

      jest
        .spyOn(client.wallet, 'getCorporationWalletTransactions')
        .mockResolvedValue(expectedTransactions);
    });

    when('I request transactions for division 1', async () => {
      result = await client.wallet.getCorporationWalletTransactions(
        corporationId,
        division,
      );
    });

    then('I should receive corporation transaction records', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('transaction_id');
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('unit_price');
      expect(result[0]).toHaveProperty('quantity');
    });
  });

  test('Unauthorized access to character wallet (403)', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an unauthenticated user for character wallet', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.wallet, 'getCharacterWallet')
        .mockRejectedValue(forbiddenError);
    });

    when('I request a character wallet balance without auth', async () => {
      try {
        await client.wallet.getCharacterWallet(1689391488);
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a 403 forbidden error for character wallet', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Unauthorized access to corporation wallet (403)', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('a non-director character for corporation wallet', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.wallet, 'getCorporationWallets')
        .mockRejectedValue(forbiddenError);
    });

    when('I request corporation wallets without auth', async () => {
      try {
        await client.wallet.getCorporationWallets(1344654522);
      } catch (e) {
        caughtError = e;
      }
    });

    then(
      'I should receive a 403 forbidden error for corporation wallet',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
      },
    );
  });

  test('Fetch balance, journal, and transactions simultaneously', ({
    given,
    when,
    then,
  }) => {
    let balance: any;
    let journal: any;
    let transactions: any;
    const characterId = 1689391488;

    given('an authenticated character for concurrent wallet ops', () => {
      const mockBalance = 5250000000.75;
      const mockJournal = [
        TestDataFactory.createWalletJournalEntry({
          id: 1000000001,
          amount: 1000000.0,
        }),
      ];
      const mockTransactions = [
        TestDataFactory.createWalletTransaction({
          transaction_id: 123456789,
          unit_price: 5.5,
          quantity: 1000,
        }),
      ];

      jest
        .spyOn(client.wallet, 'getCharacterWallet')
        .mockResolvedValue(mockBalance);
      jest
        .spyOn(client.wallet, 'getCharacterWalletJournal')
        .mockResolvedValue(mockJournal);
      jest
        .spyOn(client.wallet, 'getCharacterWalletTransactions')
        .mockResolvedValue(mockTransactions);
    });

    when(
      'I fetch balance, journal, and transactions concurrently',
      async () => {
        [balance, journal, transactions] = await Promise.all([
          client.wallet.getCharacterWallet(characterId),
          client.wallet.getCharacterWalletJournal(characterId),
          client.wallet.getCharacterWalletTransactions(characterId),
        ]);
      },
    );

    then('all wallet data should complete successfully', () => {
      expect(typeof balance).toBe('number');
      expect(balance).toBe(5250000000.75);
      expect(journal).toBeInstanceOf(Array);
      expect(journal.length).toBeGreaterThan(0);
      expect(transactions).toBeInstanceOf(Array);
      expect(transactions.length).toBeGreaterThan(0);
    });
  });

  test('Build a complete financial summary for a character', ({
    given,
    when,
    then,
  }) => {
    let balance: any;
    let journal: any;
    let transactions: any;
    const characterId = 1689391488;

    given('an authenticated character with financial history', () => {
      const mockBalance = 5250000000.75;
      const mockJournal = [
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
        }),
        TestDataFactory.createWalletJournalEntry({
          id: 1000000003,
          ref_type: 'market_transaction',
          amount: -200000.0,
          balance: 5248500000.75,
        }),
      ];
      const mockTransactions = [
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
      ];

      jest
        .spyOn(client.wallet, 'getCharacterWallet')
        .mockResolvedValue(mockBalance);
      jest
        .spyOn(client.wallet, 'getCharacterWalletJournal')
        .mockResolvedValue(mockJournal);
      jest
        .spyOn(client.wallet, 'getCharacterWalletTransactions')
        .mockResolvedValue(mockTransactions);
    });

    when('I gather all financial data', async () => {
      [balance, journal, transactions] = await Promise.all([
        client.wallet.getCharacterWallet(characterId),
        client.wallet.getCharacterWalletJournal(characterId),
        client.wallet.getCharacterWalletTransactions(characterId),
      ]);
    });

    then('I should be able to compute a financial summary', () => {
      const totalIncome = journal
        .filter((entry: any) => entry.amount > 0)
        .reduce((sum: number, entry: any) => sum + entry.amount, 0);
      const totalExpenses = journal
        .filter((entry: any) => entry.amount < 0)
        .reduce((sum: number, entry: any) => sum + Math.abs(entry.amount), 0);
      const buyTransactions = transactions.filter((t: any) => t.is_buy);
      const sellTransactions = transactions.filter((t: any) => !t.is_buy);

      expect(balance).toBe(5250000000.75);
      expect(totalIncome).toBe(1500000.0);
      expect(totalExpenses).toBe(200000.0);
      expect(buyTransactions.length).toBe(1);
      expect(sellTransactions.length).toBe(1);

      expect(totalIncome - totalExpenses).toBeGreaterThan(0);
    });
  });
});
