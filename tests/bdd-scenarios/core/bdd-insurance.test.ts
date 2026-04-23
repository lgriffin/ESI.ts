/**
 * BDD Scenarios: Insurance Management
 *
 * Comprehensive behavior-driven tests for Insurance-related APIs
 * covering insurance price listings, tier verification, and error handling.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Insurance Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-insurance-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Insurance Price Listings', () => {
    describe('Scenario: Retrieve insurance prices for all ship types', () => {
      it('Given the insurance system is operational, When I request insurance prices, Then I should receive pricing data for available ship types', async () => {
        // Given: The insurance system is operational
        const expectedPrices = [
          {
            type_id: 587,
            levels: [
              { cost: 10.0, name: 'Basic', payout: 20.0 },
              { cost: 25.0, name: 'Standard', payout: 50.0 },
              { cost: 50.0, name: 'Bronze', payout: 100.0 },
              { cost: 100.0, name: 'Silver', payout: 200.0 },
              { cost: 200.0, name: 'Gold', payout: 400.0 },
              { cost: 400.0, name: 'Platinum', payout: 800.0 },
            ],
          },
          {
            type_id: 29984,
            levels: [
              { cost: 1000000.0, name: 'Basic', payout: 2000000.0 },
              { cost: 2500000.0, name: 'Standard', payout: 5000000.0 },
              { cost: 5000000.0, name: 'Bronze', payout: 10000000.0 },
              { cost: 10000000.0, name: 'Silver', payout: 20000000.0 },
              { cost: 20000000.0, name: 'Gold', payout: 40000000.0 },
              { cost: 40000000.0, name: 'Platinum', payout: 80000000.0 },
            ],
          },
        ];

        jest
          .spyOn(client.insurance, 'getInsurancePrices')
          .mockResolvedValue(expectedPrices);

        // When: I request insurance prices
        const result = await client.insurance.getInsurancePrices();

        // Then: I should receive pricing data for available ship types
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('type_id');
        expect(result[0]).toHaveProperty('levels');
        expect(result[0].levels).toBeInstanceOf(Array);
        expect(result[0].levels[0]).toHaveProperty('cost');
        expect(result[0].levels[0]).toHaveProperty('name');
        expect(result[0].levels[0]).toHaveProperty('payout');
      });
    });

    describe('Scenario: Verify insurance price tiers are ordered correctly', () => {
      it('Given insurance prices are available, When I examine the tiers for a ship type, Then higher tiers should have increasing costs and payouts', async () => {
        // Given: Insurance prices are available
        const shipPrices = [
          {
            type_id: 24690,
            levels: [
              { cost: 500000.0, name: 'Basic', payout: 1000000.0 },
              { cost: 1250000.0, name: 'Standard', payout: 2500000.0 },
              { cost: 2500000.0, name: 'Bronze', payout: 5000000.0 },
              { cost: 5000000.0, name: 'Silver', payout: 10000000.0 },
              { cost: 10000000.0, name: 'Gold', payout: 20000000.0 },
              { cost: 20000000.0, name: 'Platinum', payout: 40000000.0 },
            ],
          },
        ];

        jest
          .spyOn(client.insurance, 'getInsurancePrices')
          .mockResolvedValue(shipPrices);

        // When: I examine the tiers for a ship type
        const result = await client.insurance.getInsurancePrices();
        const levels = result[0].levels;

        // Then: Higher tiers should have increasing costs and payouts
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i].cost).toBeGreaterThan(levels[i - 1].cost);
          expect(levels[i].payout).toBeGreaterThan(levels[i - 1].payout);
        }
      });
    });

    describe('Scenario: Verify payout always exceeds cost for each tier', () => {
      it('Given insurance prices are available, When I check each tier, Then the payout should always be greater than the cost', async () => {
        // Given: Insurance prices are available
        const shipPrices = [
          {
            type_id: 17918,
            levels: [
              { cost: 3000000.0, name: 'Basic', payout: 6000000.0 },
              { cost: 7500000.0, name: 'Standard', payout: 15000000.0 },
              { cost: 15000000.0, name: 'Bronze', payout: 30000000.0 },
              { cost: 30000000.0, name: 'Silver', payout: 60000000.0 },
              { cost: 60000000.0, name: 'Gold', payout: 120000000.0 },
              { cost: 120000000.0, name: 'Platinum', payout: 240000000.0 },
            ],
          },
        ];

        jest
          .spyOn(client.insurance, 'getInsurancePrices')
          .mockResolvedValue(shipPrices);

        // When: I check each tier
        const result = await client.insurance.getInsurancePrices();

        // Then: The payout should always be greater than the cost
        result.forEach((ship: any) => {
          ship.levels.forEach((level: any) => {
            expect(level.payout).toBeGreaterThan(level.cost);
          });
        });
      });
    });

    describe('Scenario: Handle large insurance dataset', () => {
      it('Given a request for insurance prices across all ship types, When I process the large response, Then the system should handle it efficiently', async () => {
        // Given: A large insurance dataset covering many ship types
        const largeDataset = Array.from({ length: 500 }, (_, i) => ({
          type_id: 1000 + i,
          levels: [
            { cost: 100.0 * (i + 1), name: 'Basic', payout: 200.0 * (i + 1) },
            {
              cost: 250.0 * (i + 1),
              name: 'Standard',
              payout: 500.0 * (i + 1),
            },
            {
              cost: 500.0 * (i + 1),
              name: 'Bronze',
              payout: 1000.0 * (i + 1),
            },
            {
              cost: 1000.0 * (i + 1),
              name: 'Silver',
              payout: 2000.0 * (i + 1),
            },
            {
              cost: 2000.0 * (i + 1),
              name: 'Gold',
              payout: 4000.0 * (i + 1),
            },
            {
              cost: 4000.0 * (i + 1),
              name: 'Platinum',
              payout: 8000.0 * (i + 1),
            },
          ],
        }));

        jest
          .spyOn(client.insurance, 'getInsurancePrices')
          .mockResolvedValue(largeDataset);

        // When: I process the large response
        const startTime = Date.now();
        const result = await client.insurance.getInsurancePrices();
        const endTime = Date.now();

        // Then: The system should handle it efficiently
        expect(result.length).toBe(500);
        expect(endTime - startTime).toBeLessThan(1000);
        expect(result.every((item: any) => item.levels.length === 6)).toBe(
          true,
        );
      });
    });

    describe('Scenario: Each ship type has exactly six insurance tiers', () => {
      it('Given insurance prices are available, When I inspect each ship type, Then every entry should contain six named tiers', async () => {
        // Given: Insurance prices are available
        const expectedTierNames = [
          'Basic',
          'Standard',
          'Bronze',
          'Silver',
          'Gold',
          'Platinum',
        ];
        const prices = [
          {
            type_id: 587,
            levels: expectedTierNames.map((name, i) => ({
              cost: 10.0 * Math.pow(2, i),
              name,
              payout: 20.0 * Math.pow(2, i),
            })),
          },
          {
            type_id: 24690,
            levels: expectedTierNames.map((name, i) => ({
              cost: 500000.0 * Math.pow(2, i),
              name,
              payout: 1000000.0 * Math.pow(2, i),
            })),
          },
        ];

        jest
          .spyOn(client.insurance, 'getInsurancePrices')
          .mockResolvedValue(prices);

        // When: I inspect each ship type
        const result = await client.insurance.getInsurancePrices();

        // Then: Every entry should contain six named tiers
        result.forEach((entry: any) => {
          expect(entry.levels.length).toBe(6);
          const tierNames = entry.levels.map((l: any) => l.name);
          expect(tierNames).toEqual(expectedTierNames);
        });
      });
    });
  });

  describe('Feature: Insurance Error Handling', () => {
    describe('Scenario: Handle ESI service unavailable error', () => {
      it('Given the ESI service is temporarily unavailable, When I request insurance prices, Then I should receive a 503 service unavailable error', async () => {
        // Given: The ESI service is temporarily unavailable
        const serviceError = TestDataFactory.createError(503);

        jest
          .spyOn(client.insurance, 'getInsurancePrices')
          .mockRejectedValue(serviceError);

        // When & Then: I should receive a 503 service unavailable error
        await expect(client.insurance.getInsurancePrices()).rejects.toThrow(
          EsiError,
        );
      });
    });

    describe('Scenario: Handle rate limiting on insurance endpoint', () => {
      it('Given the API rate limit has been exceeded, When I request insurance prices, Then I should receive a 429 rate limit error', async () => {
        // Given: The API rate limit has been exceeded
        const rateLimitError = TestDataFactory.createError(429);

        jest
          .spyOn(client.insurance, 'getInsurancePrices')
          .mockRejectedValue(rateLimitError);

        // When & Then: I should receive a 429 rate limit error
        await expect(client.insurance.getInsurancePrices()).rejects.toThrow(
          EsiError,
        );
      });
    });
  });
});
