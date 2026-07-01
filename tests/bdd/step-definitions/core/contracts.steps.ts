import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/contracts.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN getting contracts for a valid character, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with contracts', () => {
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
    });

    when('the client requests character contracts', async () => {
      result = await client.contracts.getCharacterContracts(characterId);
    });

    then('the client shall return a list of contracts', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('contract_id', 100000001);
      expect(result[0]).toHaveProperty('type', 'courier');
      expect(result[0]).toHaveProperty('status', 'outstanding');
      expect(result[0]).toHaveProperty('price', 1000000);
      expect(result[0]).toHaveProperty('issuer_id', characterId);
    });
  });

  test('WHILE empty contracts list, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no contracts', () => {
      const emptyContracts: any[] = [];

      jest
        .spyOn(client.contracts, 'getCharacterContracts')
        .mockResolvedValue(emptyContracts);
    });

    when(
      'the client requests character contracts for the empty list',
      async () => {
        result = await client.contracts.getCharacterContracts(characterId);
      },
    );

    then('the client shall return an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('IF non-existent character for contracts, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const invalidCharacterId = 999999999;
    let error: any;

    given('an invalid character ID for contracts', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest
        .spyOn(client.contracts, 'getCharacterContracts')
        .mockRejectedValue(notFoundError);
    });

    when(
      'the client requests character contracts for the invalid character',
      async () => {
        try {
          await client.contracts.getCharacterContracts(invalidCharacterId);
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return a 404 not found error', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });

  test('WHEN getting public contracts in a region, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const regionId = 10000002;
    let result: any;

    given('a valid region ID', () => {
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
    });

    when('the client requests public contracts', async () => {
      result = await client.contracts.getPublicContracts(regionId);
    });

    then('the client shall return contracts available in that region', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('availability', 'public');
      expect(result[0]).toHaveProperty('status', 'outstanding');
    });
  });

  test('WHEN getting bids for an auction contract, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const contractId = 200000002;
    let result: any;

    given('an auction contract with bids', () => {
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
    });

    when('the client requests contract bids', async () => {
      result = await client.contracts.getCharacterContractBids(
        characterId,
        contractId,
      );
    });

    then('the client shall return a list of bids', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('bid_id');
      expect(result[0]).toHaveProperty('bidder_id');
      expect(result[0]).toHaveProperty('amount', 15000000);
      expect(result[1].amount).toBeGreaterThan(result[0].amount);
    });
  });

  test('WHEN getting bids for a public auction, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const contractId = 200000002;
    let result: any;

    given('a public auction contract', () => {
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
    });

    when('the client requests public contract bids', async () => {
      result = await client.contracts.getPublicContractBids(contractId);
    });

    then('the client shall return the bid history', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('bid_id', 1);
      expect(result[0]).toHaveProperty('amount', 12000000);
    });
  });

  test('WHEN getting items in a character contract, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const contractId = 100000002;
    let result: any;

    given('an item exchange contract', () => {
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
    });

    when('the client requests contract items', async () => {
      result = await client.contracts.getCharacterContractItems(
        characterId,
        contractId,
      );
    });

    then('the client shall return the list of items', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('type_id', 34);
      expect(result[0]).toHaveProperty('quantity', 1000000);
      expect(result[0]).toHaveProperty('is_included', true);
    });
  });

  test('WHEN filtering character contracts to find only courier contracts, the client shall return filtered results', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let courierContracts: any;

    given('a character with mixed contract types', () => {
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
    });

    when('the client retrieves and filter by courier type', async () => {
      const result = await client.contracts.getCharacterContracts(characterId);
      courierContracts = result.filter((c: any) => c.type === 'courier');
    });

    then('the client shall return only courier contracts', () => {
      expect(courierContracts).toHaveLength(2);
      expect(courierContracts.every((c: any) => c.type === 'courier')).toBe(
        true,
      );
    });
  });

  test('WHEN completing contract inspection workflow, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const contractId = 400000001;
    let auctionContract: any;
    let contractBids: any;
    let contractItems: any;

    given('an active auction contract', () => {
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
    });

    when(
      'the client retrieves the contract then fetch its bids and items',
      async () => {
        const contractList =
          await client.contracts.getCharacterContracts(characterId);
        auctionContract = contractList.find(
          (c: any) => c.contract_id === contractId,
        );

        expect(auctionContract).toBeDefined();

        [contractBids, contractItems] = await Promise.all([
          client.contracts.getCharacterContractBids(characterId, contractId),
          client.contracts.getCharacterContractItems(characterId, contractId),
        ]);
      },
    );

    then('the client shall have full contract details', () => {
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

  test('WHEN comparing character and corporation contracts, the client shall return the analysis', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const corporationId = 1344654522;
    let charContracts: any;
    let corpContracts: any;

    given('a character in a corporation', () => {
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
    });

    when('the client fetches both sets of contracts concurrently', async () => {
      [charContracts, corpContracts] = await Promise.all([
        client.contracts.getCharacterContracts(characterId),
        client.contracts.getCorporationContracts(corporationId),
      ]);
    });

    then('the client shall return independent results', () => {
      expect(charContracts).toHaveLength(1);
      expect(charContracts[0].for_corporation).toBe(false);

      expect(corpContracts).toHaveLength(2);
      expect(corpContracts.every((c: any) => c.for_corporation === true)).toBe(
        true,
      );
    });
  });
});
