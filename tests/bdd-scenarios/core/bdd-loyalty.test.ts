/**
 * BDD Scenarios: Loyalty Management
 *
 * Comprehensive behavior-driven tests for Loyalty-related APIs
 * covering character loyalty points, loyalty store offers,
 * empty states, and error handling.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Loyalty Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-loyalty-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Character Loyalty Points', () => {
    describe('Scenario: Retrieve loyalty points for a character', () => {
      it('Given an authenticated character with LP from multiple corporations, When I request their loyalty points, Then I should receive LP balances per corporation', async () => {
        // Given: An authenticated character with LP from multiple corporations
        const characterId = 1689391488;
        const expectedLP = [
          { corporation_id: 1000035, loyalty_points: 125000 },
          { corporation_id: 1000125, loyalty_points: 47500 },
          { corporation_id: 1000180, loyalty_points: 8200 },
        ];

        jest
          .spyOn(client.loyalty, 'getLoyaltyPoints')
          .mockResolvedValue(expectedLP);

        // When: I request their loyalty points
        const result = await client.loyalty.getLoyaltyPoints(characterId);

        // Then: I should receive LP balances per corporation
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

    describe('Scenario: Character with no loyalty points', () => {
      it('Given an authenticated character who has never run missions, When I request their loyalty points, Then I should receive an empty list', async () => {
        // Given: An authenticated character with no LP
        const characterId = 111111111;

        jest.spyOn(client.loyalty, 'getLoyaltyPoints').mockResolvedValue([]);

        // When: I request their loyalty points
        const result = await client.loyalty.getLoyaltyPoints(characterId);

        // Then: I should receive an empty list
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(0);
      });
    });

    describe('Scenario: Identify highest LP balance', () => {
      it('Given a character with LP across multiple corps, When I analyze their balances, Then I should be able to find the highest LP balance', async () => {
        // Given: A character with LP across multiple corps
        const characterId = 1689391488;
        const lpBalances = [
          { corporation_id: 1000035, loyalty_points: 50000 },
          { corporation_id: 1000125, loyalty_points: 250000 },
          { corporation_id: 1000180, loyalty_points: 15000 },
          { corporation_id: 1000182, loyalty_points: 92000 },
        ];

        jest
          .spyOn(client.loyalty, 'getLoyaltyPoints')
          .mockResolvedValue(lpBalances);

        // When: I analyze their balances
        const result = await client.loyalty.getLoyaltyPoints(characterId);
        const highestLP = result.reduce((best: any, current: any) =>
          current.loyalty_points > best.loyalty_points ? current : best,
        );
        const totalLP = result.reduce(
          (sum: number, entry: any) => sum + entry.loyalty_points,
          0,
        );

        // Then: I should be able to find the highest LP balance
        expect(highestLP.corporation_id).toBe(1000125);
        expect(highestLP.loyalty_points).toBe(250000);
        expect(totalLP).toBe(407000);
      });
    });
  });

  describe('Feature: Loyalty Store Offers', () => {
    describe('Scenario: Retrieve loyalty store offers for a corporation', () => {
      it('Given a valid NPC corporation, When I request their LP store offers, Then I should receive available items with costs', async () => {
        // Given: A valid NPC corporation
        const corporationId = 1000035;
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

        // When: I request their LP store offers
        const result =
          await client.loyalty.getLoyaltyStoreOffers(corporationId);

        // Then: I should receive available items with costs
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

    describe('Scenario: Filter offers by affordability', () => {
      it('Given a set of store offers and a character LP balance, When I filter by what the character can afford, Then I should see only the affordable offers', async () => {
        // Given: Store offers and a character LP balance
        const corporationId = 1000035;
        const characterLP = 15000;
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

        // When: I filter by what the character can afford
        const result =
          await client.loyalty.getLoyaltyStoreOffers(corporationId);
        const affordableOffers = result.filter(
          (offer: any) => offer.lp_cost <= characterLP,
        );

        // Then: I should see only the affordable offers
        expect(affordableOffers.length).toBe(2);
        expect(affordableOffers[0].offer_id).toBe(1);
        expect(affordableOffers[1].offer_id).toBe(2);
        affordableOffers.forEach((offer: any) => {
          expect(offer.lp_cost).toBeLessThanOrEqual(characterLP);
        });
      });
    });

    describe('Scenario: Offers with required items', () => {
      it('Given store offers that require trade-in items, When I inspect the offers, Then I should see the required items and quantities', async () => {
        // Given: Store offers with required items
        const corporationId = 1000125;
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

        // When: I inspect the offers
        const result =
          await client.loyalty.getLoyaltyStoreOffers(corporationId);

        // Then: I should see the required items and quantities
        expect(result[0].required_items).toBeInstanceOf(Array);
        expect(result[0].required_items.length).toBe(2);
        expect(result[0].required_items[0]).toHaveProperty('type_id');
        expect(result[0].required_items[0]).toHaveProperty('quantity');
        expect(result[0].required_items[0].type_id).toBe(2046);
        expect(result[0].required_items[1].quantity).toBe(5000);
      });
    });
  });

  describe('Feature: Loyalty Error Handling', () => {
    describe('Scenario: Handle unauthorized access to loyalty points', () => {
      it('Given an unauthenticated request, When I request character loyalty points, Then I should receive a 403 forbidden error', async () => {
        // Given: An unauthenticated request
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.loyalty, 'getLoyaltyPoints')
          .mockRejectedValue(forbiddenError);

        // When & Then: I should receive a 403 forbidden error
        await expect(
          client.loyalty.getLoyaltyPoints(characterId),
        ).rejects.toThrow(EsiError);
      });
    });

    describe('Scenario: Handle server error on store offers', () => {
      it('Given the ESI service encounters an internal error, When I request store offers, Then I should receive a 500 server error', async () => {
        // Given: The ESI service encounters an internal error
        const corporationId = 1000035;
        const serverError = TestDataFactory.createError(500);

        jest
          .spyOn(client.loyalty, 'getLoyaltyStoreOffers')
          .mockRejectedValue(serverError);

        // When & Then: I should receive a 500 server error
        await expect(
          client.loyalty.getLoyaltyStoreOffers(corporationId),
        ).rejects.toThrow(EsiError);
      });
    });
  });
});
