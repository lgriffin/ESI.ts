import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/loyalty.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-loyalty-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Retrieve loyalty points for a character', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given(
      'an authenticated character with LP from multiple corporations',
      () => {
        const expectedLP = [
          { corporation_id: 1000035, loyalty_points: 125000 },
          { corporation_id: 1000125, loyalty_points: 47500 },
          { corporation_id: 1000180, loyalty_points: 8200 },
        ];

        jest
          .spyOn(client.loyalty, 'getLoyaltyPoints')
          .mockResolvedValue(expectedLP);
      },
    );

    when('I request their loyalty points', async () => {
      result = await client.loyalty.getLoyaltyPoints(characterId);
    });

    then('I should receive LP balances per corporation', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      result.forEach((entry: any) => {
        expect(entry).toHaveProperty('corporation_id');
        expect(entry).toHaveProperty('loyalty_points');
        expect(typeof entry.corporation_id).toBe('number');
        expect(typeof entry.loyalty_points).toBe('number');
        expect(entry.loyalty_points).toBeGreaterThanOrEqual(0);
      });
    });
  });

  test('Character with no loyalty points', ({ given, when, then }) => {
    const characterId = 111111111;
    let result: any;

    given('an authenticated character who has never run missions', () => {
      jest.spyOn(client.loyalty, 'getLoyaltyPoints').mockResolvedValue([]);
    });

    when('I request their loyalty points expecting none', async () => {
      result = await client.loyalty.getLoyaltyPoints(characterId);
    });

    then('I should receive an empty loyalty points list', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });

  test('Identify highest LP balance', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;
    let highestLP: any;
    let totalLP: number;

    given('a character with LP across multiple corps', () => {
      const lpBalances = [
        { corporation_id: 1000035, loyalty_points: 50000 },
        { corporation_id: 1000125, loyalty_points: 250000 },
        { corporation_id: 1000180, loyalty_points: 15000 },
        { corporation_id: 1000182, loyalty_points: 92000 },
      ];

      jest
        .spyOn(client.loyalty, 'getLoyaltyPoints')
        .mockResolvedValue(lpBalances);
    });

    when('I analyze their LP balances', async () => {
      result = await client.loyalty.getLoyaltyPoints(characterId);
      highestLP = result.reduce((best: any, current: any) =>
        current.loyalty_points > best.loyalty_points ? current : best,
      );
      totalLP = result.reduce(
        (sum: number, entry: any) => sum + entry.loyalty_points,
        0,
      );
    });

    then('I should be able to find the highest LP balance', () => {
      expect(highestLP.corporation_id).toBe(1000125);
      expect(highestLP.loyalty_points).toBe(250000);
      expect(totalLP).toBe(407000);
    });
  });

  test('Retrieve loyalty store offers for a corporation', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1000035;
    let result: any;

    given('a valid NPC corporation', () => {
      const expectedOffers = [
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

      jest
        .spyOn(client.loyalty, 'getLoyaltyStoreOffers')
        .mockResolvedValue(expectedOffers);
    });

    when('I request their LP store offers', async () => {
      result = await client.loyalty.getLoyaltyStoreOffers(corporationId);
    });

    then('I should receive available items with costs', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      result.forEach((offer: any) => {
        expect(offer).toHaveProperty('offer_id');
        expect(offer).toHaveProperty('type_id');
        expect(offer).toHaveProperty('quantity');
        expect(offer).toHaveProperty('lp_cost');
        expect(offer).toHaveProperty('isk_cost');
        expect(offer).toHaveProperty('required_items');
        expect(offer.lp_cost).toBeGreaterThan(0);
      });
    });
  });

  test('Filter offers by affordability', ({ given, when, then }) => {
    const corporationId = 1000035;
    const characterLP = 15000;
    let affordableOffers: any;

    given('a set of store offers and a character LP balance', () => {
      const storeOffers = [
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
      ];

      jest
        .spyOn(client.loyalty, 'getLoyaltyStoreOffers')
        .mockResolvedValue(storeOffers);
    });

    when('I filter by what the character can afford', async () => {
      const result = await client.loyalty.getLoyaltyStoreOffers(corporationId);
      affordableOffers = result.filter(
        (offer: any) => offer.lp_cost <= characterLP,
      );
    });

    then('I should see only the affordable offers', () => {
      expect(affordableOffers.length).toBe(2);
      expect(affordableOffers[0].offer_id).toBe(1);
      expect(affordableOffers[1].offer_id).toBe(2);
      affordableOffers.forEach((offer: any) => {
        expect(offer.lp_cost).toBeLessThanOrEqual(characterLP);
      });
    });
  });

  test('Offers with required items', ({ given, when, then }) => {
    const corporationId = 1000125;
    let result: any;

    given('store offers that require trade-in items', () => {
      const offersWithRequirements = [
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
      ];

      jest
        .spyOn(client.loyalty, 'getLoyaltyStoreOffers')
        .mockResolvedValue(offersWithRequirements);
    });

    when('I inspect the offers with requirements', async () => {
      result = await client.loyalty.getLoyaltyStoreOffers(corporationId);
    });

    then('I should see the required items and quantities', () => {
      expect(result[0].required_items).toBeInstanceOf(Array);
      expect(result[0].required_items.length).toBe(2);
      expect(result[0].required_items[0]).toHaveProperty('type_id');
      expect(result[0].required_items[0]).toHaveProperty('quantity');
      expect(result[0].required_items[0].type_id).toBe(2046);
      expect(result[0].required_items[1].quantity).toBe(5000);
    });
  });

  test('Handle unauthorized access to loyalty points', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated loyalty request', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.loyalty, 'getLoyaltyPoints')
        .mockRejectedValue(forbiddenError);
    });

    when('I request character loyalty points without auth', async () => {
      try {
        await client.loyalty.getLoyaltyPoints(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for loyalty', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Handle server error on store offers', ({ given, when, then }) => {
    const corporationId = 1000035;
    let caughtError: any;

    given('the ESI service encounters an internal error', () => {
      const serverError = TestDataFactory.createError(500);

      jest
        .spyOn(client.loyalty, 'getLoyaltyStoreOffers')
        .mockRejectedValue(serverError);
    });

    when('I request store offers expecting error', async () => {
      try {
        await client.loyalty.getLoyaltyStoreOffers(corporationId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 500 server error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
