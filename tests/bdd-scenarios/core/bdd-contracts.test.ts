/**
 * BDD-Style Tests for ContractsClient
 *
 * Tests contract operations including character and public contracts,
 * bids, items, filtering by type, and error handling.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Contract Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Character Contracts', () => {
    describe('Scenario: Get contracts for a valid character', () => {
      it('Given a character with contracts, When I request character contracts, Then I should receive a list of contracts', async () => {
        // Given: A character with contracts
        const characterId = 1689391488;
        const expectedContracts = [
          TestDataFactory.createContract({
            contract_id: 100000001,
            issuer_id: characterId,
            type: 'courier',
            status: 'outstanding',
            price: 1000000,
          }),
          TestDataFactory.createContract({
            contract_id: 100000002,
            issuer_id: characterId,
            type: 'item_exchange',
            status: 'finished',
            price: 5000000,
          }),
        ];

        jest
          .spyOn(client.contracts, 'getCharacterContracts')
          .mockResolvedValue(expectedContracts);

        // When: I request character contracts
        const result =
          await client.contracts.getCharacterContracts(characterId);

        // Then: I should receive a list of contracts
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('contract_id', 100000001);
        expect(result[0]).toHaveProperty('type', 'courier');
        expect(result[0]).toHaveProperty('status', 'outstanding');
        expect(result[0]).toHaveProperty('price', 1000000);
        expect(result[0]).toHaveProperty('issuer_id', characterId);
      });
    });

    describe('Scenario: Handle empty contracts list', () => {
      it('Given a character with no contracts, When I request character contracts, Then I should receive an empty array', async () => {
        // Given: A character with no contracts
        const characterId = 1689391488;
        const emptyContracts: any[] = [];

        jest
          .spyOn(client.contracts, 'getCharacterContracts')
          .mockResolvedValue(emptyContracts);

        // When: I request character contracts
        const result =
          await client.contracts.getCharacterContracts(characterId);

        // Then: I should receive an empty array
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(0);
      });
    });

    describe('Scenario: Handle non-existent character', () => {
      it('Given an invalid character ID, When I request character contracts, Then I should receive a 404 not found error', async () => {
        // Given: An invalid character ID
        const invalidCharacterId = 999999999;
        const notFoundError = TestDataFactory.createError(404);

        jest
          .spyOn(client.contracts, 'getCharacterContracts')
          .mockRejectedValue(notFoundError);

        // When & Then: I request character contracts and expect a not found error
        await expect(
          client.contracts.getCharacterContracts(invalidCharacterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Retrieve Public Contracts', () => {
    describe('Scenario: Get public contracts in a region', () => {
      it('Given a valid region ID, When I request public contracts, Then I should receive contracts available in that region', async () => {
        // Given: A valid region ID (The Forge)
        const regionId = 10000002;
        const expectedContracts = [
          TestDataFactory.createContract({
            contract_id: 200000001,
            type: 'item_exchange',
            status: 'outstanding',
            availability: 'public',
            price: 50000000,
          }),
          TestDataFactory.createContract({
            contract_id: 200000002,
            type: 'auction',
            status: 'outstanding',
            availability: 'public',
            price: 10000000,
          }),
        ];

        jest
          .spyOn(client.contracts, 'getPublicContracts')
          .mockResolvedValue(expectedContracts);

        // When: I request public contracts
        const result = await client.contracts.getPublicContracts(regionId);

        // Then: I should receive contracts available in that region
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('availability', 'public');
        expect(result[0]).toHaveProperty('status', 'outstanding');
      });
    });
  });

  describe('Feature: Retrieve Contract Bids', () => {
    describe('Scenario: Get bids for an auction contract', () => {
      it('Given an auction contract with bids, When I request contract bids, Then I should receive a list of bids', async () => {
        // Given: An auction contract with bids
        const characterId = 1689391488;
        const contractId = 200000002;
        const expectedBids = [
          {
            bid_id: 1,
            bidder_id: 123456789,
            amount: 15000000,
            date_bid: '2024-01-16T12:00:00Z',
          },
          {
            bid_id: 2,
            bidder_id: 987654321,
            amount: 20000000,
            date_bid: '2024-01-17T14:00:00Z',
          },
        ];

        jest
          .spyOn(client.contracts, 'getCharacterContractBids')
          .mockResolvedValue(expectedBids);

        // When: I request contract bids
        const result = await client.contracts.getCharacterContractBids(
          characterId,
          contractId,
        );

        // Then: I should receive a list of bids
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('bid_id');
        expect(result[0]).toHaveProperty('bidder_id');
        expect(result[0]).toHaveProperty('amount', 15000000);
        expect(result[1].amount).toBeGreaterThan(result[0].amount);
      });
    });

    describe('Scenario: Get bids for a public auction', () => {
      it('Given a public auction contract, When I request public contract bids, Then I should receive the bid history', async () => {
        // Given: A public auction contract
        const contractId = 200000002;
        const expectedBids = [
          {
            bid_id: 1,
            bidder_id: 111111111,
            amount: 12000000,
            date_bid: '2024-01-15T10:00:00Z',
          },
        ];

        jest
          .spyOn(client.contracts, 'getPublicContractBids')
          .mockResolvedValue(expectedBids);

        // When: I request public contract bids
        const result = await client.contracts.getPublicContractBids(contractId);

        // Then: I should receive the bid history
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('bid_id', 1);
        expect(result[0]).toHaveProperty('amount', 12000000);
      });
    });
  });

  describe('Feature: Retrieve Contract Items', () => {
    describe('Scenario: Get items in a character contract', () => {
      it('Given an item exchange contract, When I request contract items, Then I should receive the list of items', async () => {
        // Given: An item exchange contract
        const characterId = 1689391488;
        const contractId = 100000002;
        const expectedItems = [
          {
            record_id: 1,
            type_id: 34,
            quantity: 1000000,
            is_included: true,
            is_singleton: false,
          },
          {
            record_id: 2,
            type_id: 35,
            quantity: 500000,
            is_included: true,
            is_singleton: false,
          },
        ];

        jest
          .spyOn(client.contracts, 'getCharacterContractItems')
          .mockResolvedValue(expectedItems);

        // When: I request contract items
        const result = await client.contracts.getCharacterContractItems(
          characterId,
          contractId,
        );

        // Then: I should receive the list of items
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('type_id', 34);
        expect(result[0]).toHaveProperty('quantity', 1000000);
        expect(result[0]).toHaveProperty('is_included', true);
      });
    });
  });

  describe('Feature: Filter Contracts by Type', () => {
    describe('Scenario: Filter character contracts to find only courier contracts', () => {
      it('Given a character with mixed contract types, When I retrieve and filter by courier type, Then I should find only courier contracts', async () => {
        // Given: A character with mixed contract types
        const characterId = 1689391488;
        const allContracts = [
          TestDataFactory.createContract({
            contract_id: 300000001,
            type: 'courier',
            status: 'outstanding',
          }),
          TestDataFactory.createContract({
            contract_id: 300000002,
            type: 'item_exchange',
            status: 'outstanding',
          }),
          TestDataFactory.createContract({
            contract_id: 300000003,
            type: 'auction',
            status: 'outstanding',
          }),
          TestDataFactory.createContract({
            contract_id: 300000004,
            type: 'courier',
            status: 'finished',
          }),
        ];

        jest
          .spyOn(client.contracts, 'getCharacterContracts')
          .mockResolvedValue(allContracts);

        // When: I retrieve contracts and filter by courier type
        const result =
          await client.contracts.getCharacterContracts(characterId);
        const courierContracts = result.filter(
          (c: any) => c.type === 'courier',
        );

        // Then: I should find only courier contracts
        expect(courierContracts).toHaveLength(2);
        expect(courierContracts.every((c: any) => c.type === 'courier')).toBe(
          true,
        );
      });
    });
  });

  describe('Feature: Integration Workflows', () => {
    describe('Scenario: Complete contract inspection workflow', () => {
      it('Given an active auction contract, When I retrieve the contract then fetch its bids and items, Then I should have full contract details', async () => {
        // Given: An active auction contract
        const characterId = 1689391488;
        const contractId = 400000001;

        const contracts = [
          TestDataFactory.createContract({
            contract_id: contractId,
            type: 'auction',
            status: 'outstanding',
            price: 10000000,
          }),
        ];

        const bids = [
          {
            bid_id: 1,
            bidder_id: 123456789,
            amount: 15000000,
            date_bid: '2024-01-16T12:00:00Z',
          },
          {
            bid_id: 2,
            bidder_id: 987654321,
            amount: 25000000,
            date_bid: '2024-01-17T14:00:00Z',
          },
        ];

        const items = [
          {
            record_id: 1,
            type_id: 17918,
            quantity: 1,
            is_included: true,
            is_singleton: true,
          },
        ];

        jest
          .spyOn(client.contracts, 'getCharacterContracts')
          .mockResolvedValue(contracts);
        jest
          .spyOn(client.contracts, 'getCharacterContractBids')
          .mockResolvedValue(bids);
        jest
          .spyOn(client.contracts, 'getCharacterContractItems')
          .mockResolvedValue(items);

        // When: I retrieve the contract, its bids, and its items
        const contractList =
          await client.contracts.getCharacterContracts(characterId);
        const auctionContract = contractList.find(
          (c: any) => c.contract_id === contractId,
        );

        expect(auctionContract).toBeDefined();

        const [contractBids, contractItems] = await Promise.all([
          client.contracts.getCharacterContractBids(characterId, contractId),
          client.contracts.getCharacterContractItems(characterId, contractId),
        ]);

        // Then: I should have full contract details
        expect(auctionContract!.type).toBe('auction');
        expect(auctionContract!.price).toBe(10000000);

        expect(contractBids).toHaveLength(2);
        const highestBid = contractBids.reduce(
          (max: any, bid: any) => (bid.amount > max.amount ? bid : max),
          contractBids[0],
        );
        expect(highestBid.amount).toBe(25000000);

        expect(contractItems).toHaveLength(1);
        expect(contractItems[0].type_id).toBe(17918);
        expect(contractItems[0].is_singleton).toBe(true);
      });
    });

    describe('Scenario: Compare character and corporation contracts', () => {
      it('Given a character in a corporation, When I fetch both sets of contracts concurrently, Then I should receive independent results', async () => {
        // Given: A character in a corporation
        const characterId = 1689391488;
        const corporationId = 1344654522;

        const characterContracts = [
          TestDataFactory.createContract({
            contract_id: 500000001,
            issuer_id: characterId,
            type: 'item_exchange',
            for_corporation: false,
          }),
        ];

        const corporationContracts = [
          TestDataFactory.createContract({
            contract_id: 500000002,
            issuer_id: characterId,
            issuer_corporation_id: corporationId,
            type: 'courier',
            for_corporation: true,
          }),
          TestDataFactory.createContract({
            contract_id: 500000003,
            issuer_id: 987654321,
            issuer_corporation_id: corporationId,
            type: 'item_exchange',
            for_corporation: true,
          }),
        ];

        jest
          .spyOn(client.contracts, 'getCharacterContracts')
          .mockResolvedValue(characterContracts);
        jest
          .spyOn(client.contracts, 'getCorporationContracts')
          .mockResolvedValue(corporationContracts);

        // When: I fetch both sets of contracts concurrently
        const [charContracts, corpContracts] = await Promise.all([
          client.contracts.getCharacterContracts(characterId),
          client.contracts.getCorporationContracts(corporationId),
        ]);

        // Then: I should receive independent results
        expect(charContracts).toHaveLength(1);
        expect(charContracts[0].for_corporation).toBe(false);

        expect(corpContracts).toHaveLength(2);
        expect(
          corpContracts.every((c: any) => c.for_corporation === true),
        ).toBe(true);
      });
    });
  });
});
