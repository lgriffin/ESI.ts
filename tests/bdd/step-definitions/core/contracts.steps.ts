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

const feature = loadFeature('tests/bdd/features/core/0009-contracts.feature');

/**
 * Match a request whose path ends exactly at `path`, so the contract list
 * route does not also swallow the bids and items routes beneath it.
 */
const exactPath = (path: string): RegExp => new RegExp(`${path}(\\?|$)`);

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Contract list holding a courier contract and an item exchange contract', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with contracts', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/contracts`),
        body: [
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
        ],
      });
    });

    when('the client requests character contracts', async () => {
      result = await client.contracts.getCharacterContracts(characterId);
    });

    then('the client shall return a list of contracts', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/contracts`,
      );
      expect(lastRequest().headers.authorization).toBe(
        'Bearer bdd-access-token',
      );
      expect(
        result.map((c: any) => ({
          contract_id: c.contract_id,
          type: c.type,
          status: c.status,
          price: c.price,
          issuer_id: c.issuer_id,
        })),
      ).toEqual([
        {
          contract_id: 100000001,
          type: 'courier',
          status: 'outstanding',
          price: 1000000,
          issuer_id: characterId,
        },
        {
          contract_id: 100000002,
          type: 'item_exchange',
          status: 'finished',
          price: 5000000,
          issuer_id: characterId,
        },
      ]);
    });
  });

  test('Character with an empty contract list', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no contracts', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/contracts`),
        body: [],
      });
    });

    when(
      'the client requests character contracts for the empty list',
      async () => {
        result = await client.contracts.getCharacterContracts(characterId);
      },
    );

    then('the client shall return an empty array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  test('Unknown character ID rejects the request', ({ given, when, then }) => {
    const invalidCharacterId = 999999999;
    let error: any;

    given('an invalid character ID for contracts', () => {
      queueError(404, 'Character not found', {
        match: exactPath(`/characters/${invalidCharacterId}/contracts`),
      });
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
      expect((error as EsiError).statusCode).toBe(404);
      // 404 is not retryable: exactly one request reaches ESI.
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Public contracts outstanding in a region', ({ given, when, then }) => {
    const regionId = 10000002;
    let result: any;

    given('a valid region ID', () => {
      queueResponse({
        match: exactPath(`/contracts/public/${regionId}`),
        body: [
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
        ],
      });
    });

    when('the client requests public contracts', async () => {
      result = await client.contracts.getPublicContracts(regionId);
    });

    then('the client shall return contracts available in that region', () => {
      expect(lastRequest().url.pathname).toBe(`/contracts/public/${regionId}`);
      expect(lastRequest().headers.authorization).toBeUndefined();
      expect(
        result.map((c: any) => [c.contract_id, c.availability, c.status]),
      ).toEqual([
        [200000001, 'public', 'outstanding'],
        [200000002, 'public', 'outstanding'],
      ]);
    });
  });

  test('Bid history on a character auction contract', ({
    given,
    when,
    then,
  }) => {
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
    let result: any;

    given('an auction contract with bids', () => {
      queueResponse({
        match: exactPath(
          `/characters/${characterId}/contracts/${contractId}/bids`,
        ),
        body: expectedBids,
      });
    });

    when('the client requests contract bids', async () => {
      result = await client.contracts.getCharacterContractBids(
        characterId,
        contractId,
      );
    });

    then('the client shall return a list of bids', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/contracts/${contractId}/bids`,
      );
      expect(lastRequest().headers.authorization).toBe(
        'Bearer bdd-access-token',
      );
      expect(result).toEqual(expectedBids);
      expect(result[1].amount).toBeGreaterThan(result[0].amount);
    });
  });

  test('Bid history on a public auction contract', ({ given, when, then }) => {
    const contractId = 200000002;
    const expectedBids = [
      {
        bid_id: 1,
        bidder_id: 111111111,
        amount: 12000000,
        date_bid: '2024-01-15T10:00:00Z',
      },
    ];
    let result: any;

    given('a public auction contract', () => {
      queueResponse({
        match: exactPath(`/contracts/public/bids/${contractId}`),
        body: expectedBids,
      });
    });

    when('the client requests public contract bids', async () => {
      result = await client.contracts.getPublicContractBids(contractId);
    });

    then('the client shall return the bid history', () => {
      expect(lastRequest().url.pathname).toBe(
        `/contracts/public/bids/${contractId}`,
      );
      expect(lastRequest().headers.authorization).toBeUndefined();
      expect(result).toEqual(expectedBids);
    });
  });

  test('Item lines on an item exchange contract', ({ given, when, then }) => {
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
        is_included: false,
        is_singleton: false,
      },
    ];
    let result: any;

    given('an item exchange contract', () => {
      queueResponse({
        match: exactPath(
          `/characters/${characterId}/contracts/${contractId}/items`,
        ),
        body: expectedItems,
      });
    });

    when('the client requests contract items', async () => {
      result = await client.contracts.getCharacterContractItems(
        characterId,
        contractId,
      );
    });

    then('the client shall return the list of items', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/contracts/${contractId}/items`,
      );
      expect(
        result.map((i: any) => [i.type_id, i.quantity, i.is_included]),
      ).toEqual([
        [34, 1000000, true],
        [35, 500000, false],
      ]);
    });
  });

  test('Mixed contract list filtered by the caller on the type field', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let courierContracts: any;

    given('a character with mixed contract types', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/contracts`),
        body: [
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
        ],
      });
    });

    when('the client retrieves and filter by courier type', async () => {
      const result = await client.contracts.getCharacterContracts(characterId);
      courierContracts = result.filter((c: any) => c.type === 'courier');
    });

    then('the client shall return only courier contracts', () => {
      expect(
        courierContracts.map((c: any) => [c.contract_id, c.type, c.status]),
      ).toEqual([
        [300000001, 'courier', 'outstanding'],
        [300000004, 'courier', 'finished'],
      ]);
    });
  });

  test('Contract located in the list, then its bids and items', ({
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
      queueResponse({
        match: exactPath(`/characters/${characterId}/contracts`),
        body: [
          TestDataFactory.createContract({
            contract_id: 400000000,
            type: 'courier',
            status: 'outstanding',
          }),
          TestDataFactory.createContract({
            contract_id: contractId,
            type: 'auction',
            status: 'outstanding',
            price: 10000000,
          }),
        ],
      });
      queueResponse({
        match: exactPath(
          `/characters/${characterId}/contracts/${contractId}/bids`,
        ),
        body: [
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
        ],
      });
      queueResponse({
        match: exactPath(
          `/characters/${characterId}/contracts/${contractId}/items`,
        ),
        body: [
          {
            record_id: 1,
            type_id: 17918,
            quantity: 1,
            is_included: true,
            is_singleton: true,
          },
        ],
      });
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
          client.contracts.getCharacterContractBids(
            characterId,
            auctionContract.contract_id,
          ),
          client.contracts.getCharacterContractItems(
            characterId,
            auctionContract.contract_id,
          ),
        ]);
      },
    );

    then('the client shall have full contract details', () => {
      const paths = sentRequests().map((r) => r.url.pathname);
      expect(paths).toHaveLength(3);
      expect(paths[0]).toBe(`/characters/${characterId}/contracts`);
      expect(paths.slice(1).sort()).toEqual([
        `/characters/${characterId}/contracts/${contractId}/bids`,
        `/characters/${characterId}/contracts/${contractId}/items`,
      ]);

      expect(auctionContract.type).toBe('auction');
      expect(auctionContract.price).toBe(10000000);

      expect(contractBids.map((b: any) => [b.bid_id, b.amount])).toEqual([
        [1, 15000000],
        [2, 25000000],
      ]);
      const highestBid = contractBids.reduce(
        (max: any, bid: any) => (bid.amount > max.amount ? bid : max),
        contractBids[0],
      );
      expect(highestBid.bidder_id).toBe(987654321);

      expect(contractItems).toEqual([
        {
          record_id: 1,
          type_id: 17918,
          quantity: 1,
          is_included: true,
          is_singleton: true,
        },
      ]);
    });
  });

  test('Character list and corporation list fetched at once', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const corporationId = 1344654522;
    let charContracts: any;
    let corpContracts: any;

    given('a character in a corporation', () => {
      // The corporation list is queued first and the character list answers
      // last, so a client that paired responses by arrival order would swap them.
      queueResponse({
        match: exactPath(`/corporations/${corporationId}/contracts`),
        delayMs: 2,
        body: [
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
        ],
      });
      queueResponse({
        match: exactPath(`/characters/${characterId}/contracts`),
        delayMs: 10,
        body: [
          TestDataFactory.createContract({
            contract_id: 500000001,
            issuer_id: characterId,
            type: 'item_exchange',
            for_corporation: false,
          }),
        ],
      });
    });

    when('the client fetches both sets of contracts concurrently', async () => {
      [charContracts, corpContracts] = await Promise.all([
        client.contracts.getCharacterContracts(characterId),
        client.contracts.getCorporationContracts(corporationId),
      ]);
    });

    then('the client shall return independent results', () => {
      expect(sentRequests()).toHaveLength(2);

      expect(
        charContracts.map((c: any) => [c.contract_id, c.for_corporation]),
      ).toEqual([[500000001, false]]);

      expect(
        corpContracts.map((c: any) => [c.contract_id, c.for_corporation]),
      ).toEqual([
        [500000002, true],
        [500000003, true],
      ]);
    });
  });
});
