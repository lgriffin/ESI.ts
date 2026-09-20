import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0021-loyalty.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Balances from three corporations are returned with typed fields', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const expectedLP = [
      { corporation_id: 1000035, loyalty_points: 125000 },
      { corporation_id: 1000125, loyalty_points: 47500 },
      { corporation_id: 1000180, loyalty_points: 8200 },
    ];
    let result: any;

    given(
      'an authenticated character with LP from multiple corporations',
      () => {
        queueResponse({
          match: `/characters/${characterId}/loyalty/points`,
          body: expectedLP,
        });
      },
    );

    when('the client requests their loyalty points', async () => {
      result = await client.loyalty.getLoyaltyPoints(characterId);
    });

    then('the client shall return LP balances per corporation', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        new RegExp(`/characters/${characterId}/loyalty/points/?$`),
      );
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedLP);
      result.forEach((entry: any) => {
        expect(typeof entry.corporation_id).toBe('number');
        expect(typeof entry.loyalty_points).toBe('number');
        expect(entry.loyalty_points).toBeGreaterThanOrEqual(0);
      });
    });
  });

  test('Character who has never run missions returns no balances', ({
    given,
    when,
    then,
  }) => {
    const characterId = 111111111;
    let result: any;

    given('an authenticated character who has never run missions', () => {
      queueResponse({
        match: `/characters/${characterId}/loyalty/points`,
        body: [],
      });
    });

    when(
      'the client requests their loyalty points expecting none',
      async () => {
        result = await client.loyalty.getLoyaltyPoints(characterId);
      },
    );

    then('the client shall return an empty loyalty points list', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('Four returned balances support maximum and total calculations', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;
    let highestLP: any;
    let totalLP: number;

    given('a character with LP across multiple corps', () => {
      queueResponse({
        match: `/characters/${characterId}/loyalty/points`,
        body: [
          { corporation_id: 1000035, loyalty_points: 50000 },
          { corporation_id: 1000125, loyalty_points: 250000 },
          { corporation_id: 1000180, loyalty_points: 15000 },
          { corporation_id: 1000182, loyalty_points: 92000 },
        ],
      });
    });

    when('the client analyzes their LP balances', async () => {
      result = await client.loyalty.getLoyaltyPoints(characterId);
      highestLP = result.reduce((best: any, current: any) =>
        current.loyalty_points > best.loyalty_points ? current : best,
      );
      totalLP = result.reduce(
        (sum: number, entry: any) => sum + entry.loyalty_points,
        0,
      );
    });

    then('the client shall find the highest LP balance', () => {
      expect(result.map((e: any) => e.corporation_id)).toEqual([
        1000035, 1000125, 1000180, 1000182,
      ]);
      expect(highestLP).toEqual({
        corporation_id: 1000125,
        loyalty_points: 250000,
      });
      expect(totalLP).toBe(407000);
    });
  });

  test('Store catalogue returns offers with LP and ISK costs', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1000035;
    const expectedOffers = [
      {
        offer_id: 1,
        type_id: 17703,
        quantity: 1,
        lp_cost: 10000,
        isk_cost: 5000000,
        ak_cost: 0,
        required_items: [],
      },
      {
        offer_id: 2,
        type_id: 17718,
        quantity: 5,
        lp_cost: 5000,
        isk_cost: 2500000,
        required_items: [{ type_id: 34, quantity: 1000 }],
      },
      {
        offer_id: 3,
        type_id: 2048,
        quantity: 1,
        lp_cost: 250000,
        isk_cost: 125000000,
        required_items: [{ type_id: 2046, quantity: 1 }],
      },
    ];
    let result: any;

    given('a valid NPC corporation', () => {
      queueResponse({
        match: `/loyalty/stores/${corporationId}/offers`,
        body: expectedOffers,
      });
    });

    when('the client requests their LP store offers', async () => {
      result = await client.loyalty.getLoyaltyStoreOffers(corporationId);
    });

    then('the client shall return available items with costs', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        new RegExp(`/loyalty/stores/${corporationId}/offers/?$`),
      );
      // The store catalogue is public: no bearer token is sent.
      expect(request.headers['authorization']).toBeUndefined();
      expect(result).toEqual(expectedOffers);
    });
  });

  test('Offers priced above the character balance are excluded by an lp_cost filter', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1000035;
    const characterLP = 15000;
    let affordableOffers: any;

    given('a set of store offers and a character LP balance', () => {
      queueResponse({
        match: `/loyalty/stores/${corporationId}/offers`,
        body: [
          {
            offer_id: 1,
            type_id: 17703,
            quantity: 1,
            lp_cost: 10000,
            isk_cost: 5000000,
            required_items: [],
          },
          {
            offer_id: 2,
            type_id: 17718,
            quantity: 5,
            lp_cost: 5000,
            isk_cost: 2500000,
            required_items: [],
          },
          {
            offer_id: 3,
            type_id: 2048,
            quantity: 1,
            lp_cost: 250000,
            isk_cost: 125000000,
            required_items: [],
          },
        ],
      });
    });

    when('the client filters by what the character can afford', async () => {
      const result = await client.loyalty.getLoyaltyStoreOffers(corporationId);
      affordableOffers = result.filter(
        (offer: any) => offer.lp_cost <= characterLP,
      );
    });

    then('the client shall report only the affordable offers', () => {
      expect(affordableOffers.map((o: any) => [o.offer_id, o.lp_cost])).toEqual(
        [
          [1, 10000],
          [2, 5000],
        ],
      );
    });
  });

  test('Offer requiring a hull and a mineral lists both trade-in items', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1000125;
    let result: any;

    given('store offers that require trade-in items', () => {
      queueResponse({
        match: `/loyalty/stores/${corporationId}/offers`,
        body: [
          {
            offer_id: 10,
            type_id: 2048,
            quantity: 1,
            lp_cost: 250000,
            isk_cost: 125000000,
            required_items: [
              { type_id: 2046, quantity: 1 },
              { type_id: 34, quantity: 5000 },
            ],
          },
        ],
      });
    });

    when('the client inspects the offers with requirements', async () => {
      result = await client.loyalty.getLoyaltyStoreOffers(corporationId);
    });

    then('the client shall report the required items and quantities', () => {
      expect(result).toHaveLength(1);
      expect(result[0].required_items).toEqual([
        { type_id: 2046, quantity: 1 },
        { type_id: 34, quantity: 5000 },
      ]);
    });
  });

  test('Unauthenticated loyalty point request is rejected with 403', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated loyalty request', () => {
      // ESI refuses a token without esi-characters.read_loyalty.v1 with 403.
      queueError(403, 'Token not valid for scope(s)', {
        match: `/characters/${characterId}/loyalty/points`,
      });
    });

    when(
      'the client requests character loyalty points without auth',
      async () => {
        try {
          await client.loyalty.getLoyaltyPoints(characterId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the client shall return a 403 forbidden error for loyalty', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Store offer request fails with an upstream 500', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1000035;
    let caughtError: any;

    given('the ESI service encounters an internal error', () => {
      queueError(500, 'Internal server error', {
        match: `/loyalty/stores/${corporationId}/offers`,
      });
    });

    when('the client requests store offers expecting error', async () => {
      try {
        await client.loyalty.getLoyaltyStoreOffers(corporationId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 500 server error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(500);
      // 500 is not retried.
      expect(sentRequests()).toHaveLength(1);
    });
  });
});
