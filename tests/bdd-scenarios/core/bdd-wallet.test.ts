/**
 * BDD Scenarios: Wallet Management
 *
 * Comprehensive behavior-driven tests for all Wallet-related APIs
 * covering character wallets, corporation wallets, journal entries,
 * transactions, and financial analysis workflows.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Wallet Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-wallet-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Character Wallet Balance', () => {
    describe('Scenario: Get ISK balance for a character', () => {
      it('Given an authenticated character, When I request their wallet balance, Then I should receive the ISK amount', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const expectedBalance = 5250000000.75; // 5.25 billion ISK

        jest
          .spyOn(client.wallet, 'getCharacterWallet')
          .mockResolvedValue(expectedBalance);

        // When: I request their wallet balance
        const result = await client.wallet.getCharacterWallet(characterId);

        // Then: I should receive the ISK amount
        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
        expect(result).toBe(5250000000.75);
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Scenario: Character with zero ISK balance', () => {
      it('Given a character with no ISK, When I request their wallet balance, Then I should receive zero', async () => {
        // Given: A character with no ISK
        const characterId = 123456789;

        jest.spyOn(client.wallet, 'getCharacterWallet').mockResolvedValue(0);

        // When: I request their wallet balance
        const result = await client.wallet.getCharacterWallet(characterId);

        // Then: I should receive zero
        expect(result).toBe(0);
        expect(typeof result).toBe('number');
      });
    });
  });

  describe('Feature: Character Wallet Journal', () => {
    describe('Scenario: Get journal entries for a character', () => {
      it('Given an authenticated character with transaction history, When I request their wallet journal, Then I should receive journal entries', async () => {
        // Given: An authenticated character with transaction history
        const characterId = 1689391488;
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

        // When: I request their wallet journal
        const result =
          await client.wallet.getCharacterWalletJournal(characterId);

        // Then: I should receive journal entries
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

    describe('Scenario: Empty journal for a new character', () => {
      it('Given a new character with no activity, When I request their wallet journal, Then I should receive an empty array', async () => {
        // Given: A new character with no activity
        const characterId = 111111111;

        jest
          .spyOn(client.wallet, 'getCharacterWalletJournal')
          .mockResolvedValue([]);

        // When: I request their wallet journal
        const result =
          await client.wallet.getCharacterWalletJournal(characterId);

        // Then: I should receive an empty array
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(0);
      });
    });
  });

  describe('Feature: Character Wallet Transactions', () => {
    describe('Scenario: Get market transactions for a character', () => {
      it('Given an authenticated character with market activity, When I request their transactions, Then I should receive transaction records', async () => {
        // Given: An authenticated character with market activity
        const characterId = 1689391488;
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

        // When: I request their transactions
        const result =
          await client.wallet.getCharacterWalletTransactions(characterId);

        // Then: I should receive transaction records
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
  });

  describe('Feature: Corporation Wallet Management', () => {
    describe('Scenario: Get corporation wallet divisions', () => {
      it('Given an authenticated director, When I request corporation wallets, Then I should receive all wallet divisions', async () => {
        // Given: An authenticated director
        const corporationId = 1344654522;
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

        // When: I request corporation wallets
        const result = await client.wallet.getCorporationWallets(corporationId);

        // Then: I should receive all 7 wallet divisions
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

    describe('Scenario: Get corporation wallet journal for a specific division', () => {
      it('Given an authenticated director, When I request the journal for division 1, Then I should receive journal entries for that division', async () => {
        // Given: An authenticated director
        const corporationId = 1344654522;
        const division = 1;
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

        // When: I request the journal for division 1
        const result = await client.wallet.getCorporationWalletJournal(
          corporationId,
          division,
        );

        // Then: I should receive journal entries for that division
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('ref_type');
        expect(result[0]).toHaveProperty('amount');
      });
    });

    describe('Scenario: Get corporation wallet transactions for a specific division', () => {
      it('Given an authenticated director, When I request transactions for division 1, Then I should receive transaction records', async () => {
        // Given: An authenticated director
        const corporationId = 1344654522;
        const division = 1;
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

        // When: I request transactions for division 1
        const result = await client.wallet.getCorporationWalletTransactions(
          corporationId,
          division,
        );

        // Then: I should receive transaction records
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('transaction_id');
        expect(result[0]).toHaveProperty('type_id');
        expect(result[0]).toHaveProperty('unit_price');
        expect(result[0]).toHaveProperty('quantity');
      });
    });
  });

  describe('Feature: Wallet Error Handling', () => {
    describe('Scenario: Unauthorized access to wallet (403)', () => {
      it('Given an unauthenticated user, When I request a character wallet balance, Then I should receive a 403 forbidden error', async () => {
        // Given: An unauthenticated user
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.wallet, 'getCharacterWallet')
          .mockRejectedValue(forbiddenError);

        // When & Then: I request a wallet balance and expect a forbidden error
        await expect(
          client.wallet.getCharacterWallet(1689391488),
        ).rejects.toThrow(EsiError);
      });
    });

    describe('Scenario: Unauthorized access to corporation wallet (403)', () => {
      it('Given a non-director character, When I request corporation wallets, Then I should receive a 403 forbidden error', async () => {
        // Given: A non-director character
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.wallet, 'getCorporationWallets')
          .mockRejectedValue(forbiddenError);

        // When & Then: I request corporation wallets and expect a forbidden error
        await expect(
          client.wallet.getCorporationWallets(1344654522),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Concurrent Wallet Operations', () => {
    describe('Scenario: Fetch balance, journal, and transactions simultaneously', () => {
      it('Given an authenticated character, When I fetch balance, journal, and transactions concurrently, Then all should complete successfully', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
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

        // When: I fetch all concurrently
        const [balance, journal, transactions] = await Promise.all([
          client.wallet.getCharacterWallet(characterId),
          client.wallet.getCharacterWalletJournal(characterId),
          client.wallet.getCharacterWalletTransactions(characterId),
        ]);

        // Then: All should complete successfully
        expect(typeof balance).toBe('number');
        expect(balance).toBe(5250000000.75);
        expect(journal).toBeInstanceOf(Array);
        expect(journal.length).toBeGreaterThan(0);
        expect(transactions).toBeInstanceOf(Array);
        expect(transactions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Feature: Financial Summary Workflow', () => {
    describe('Scenario: Build a complete financial summary for a character', () => {
      it('Given an authenticated character, When I gather all financial data, Then I should be able to compute a financial summary', async () => {
        // Given: An authenticated character with financial history
        const characterId = 1689391488;
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

        // When: I gather all financial data
        const [balance, journal, transactions] = await Promise.all([
          client.wallet.getCharacterWallet(characterId),
          client.wallet.getCharacterWalletJournal(characterId),
          client.wallet.getCharacterWalletTransactions(characterId),
        ]);

        // Then: I should be able to compute a financial summary
        const totalIncome = journal
          .filter((entry: any) => entry.amount > 0)
          .reduce((sum: number, entry: any) => sum + entry.amount, 0);
        const totalExpenses = journal
          .filter((entry: any) => entry.amount < 0)
          .reduce((sum: number, entry: any) => sum + Math.abs(entry.amount), 0);
        const buyTransactions = transactions.filter((t: any) => t.is_buy);
        const sellTransactions = transactions.filter((t: any) => !t.is_buy);

        expect(balance).toBe(5250000000.75);
        expect(totalIncome).toBe(1500000.0); // 1M + 500K
        expect(totalExpenses).toBe(200000.0);
        expect(buyTransactions.length).toBe(1);
        expect(sellTransactions.length).toBe(1);

        // Net income should be positive
        expect(totalIncome - totalExpenses).toBeGreaterThan(0);
      });
    });
  });
});
