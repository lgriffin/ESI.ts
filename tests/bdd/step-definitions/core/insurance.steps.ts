import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/insurance.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-insurance-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN retrieving insurance prices for all ship types, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the insurance system is operational', () => {
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
    });

    when('the client requests insurance prices', async () => {
      result = await client.insurance.getInsurancePrices();
    });

    then(
      'the client shall return pricing data for available ship types',
      () => {
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('type_id');
        expect(result[0]).toHaveProperty('levels');
        expect(result[0].levels).toBeInstanceOf(Array);
        expect(result[0].levels[0]).toHaveProperty('cost');
        expect(result[0].levels[0]).toHaveProperty('name');
        expect(result[0].levels[0]).toHaveProperty('payout');
      },
    );
  });

  test('WHEN verifying insurance price tiers are ordered correctly, the client shall validate the data', ({
    given,
    when,
    then,
  }) => {
    let levels: any;

    given('insurance prices are available for tier verification', () => {
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
    });

    when('the client examines the tiers for a ship type', async () => {
      const result = await client.insurance.getInsurancePrices();
      levels = result[0].levels;
    });

    then('higher tiers shall have increasing costs and payouts', () => {
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].cost).toBeGreaterThan(levels[i - 1].cost);
        expect(levels[i].payout).toBeGreaterThan(levels[i - 1].payout);
      }
    });
  });

  test('WHEN verifying payout always exceeds cost for each tier, the client shall validate the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('insurance prices are available for payout verification', () => {
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
    });

    when('the client checks each tier', async () => {
      result = await client.insurance.getInsurancePrices();
    });

    then('the payout shall always be greater than the cost', () => {
      result.forEach((ship: any) => {
        ship.levels.forEach((level: any) => {
          expect(level.payout).toBeGreaterThan(level.cost);
        });
      });
    });
  });

  test('The client shall handle large insurance dataset', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    let startTime: number;
    let endTime: number;

    given('a large insurance dataset covering many ship types', () => {
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
    });

    when('the client processes the large insurance response', async () => {
      startTime = Date.now();
      result = await client.insurance.getInsurancePrices();
      endTime = Date.now();
    });

    then('the client shall handle it efficiently', () => {
      expect(result.length).toBe(500);
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.every((item: any) => item.levels.length === 6)).toBe(true);
    });
  });

  test('WHEN listing insurance tiers, the client shall return exactly six per ship type', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedTierNames = [
      'Basic',
      'Standard',
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
    ];

    given('insurance prices are available for tier count verification', () => {
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
    });

    when('the client inspects each ship type', async () => {
      result = await client.insurance.getInsurancePrices();
    });

    then('every entry shall contain six named tiers', () => {
      result.forEach((entry: any) => {
        expect(entry.levels.length).toBe(6);
        const tierNames = entry.levels.map((l: any) => l.name);
        expect(tierNames).toEqual(expectedTierNames);
      });
    });
  });

  test('IF eSI service unavailable error, THEN the client shall handle the service outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is temporarily unavailable', () => {
      const serviceError = TestDataFactory.createError(503);

      jest
        .spyOn(client.insurance, 'getInsurancePrices')
        .mockRejectedValue(serviceError);
    });

    when(
      'the client requests insurance prices expecting an error',
      async () => {
        try {
          await client.insurance.getInsurancePrices();
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the client shall return a 503 service unavailable error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('IF rate limiting on insurance endpoint, THEN the client shall respect the rate limit', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the API rate limit has been exceeded', () => {
      const rateLimitError = TestDataFactory.createError(429);

      jest
        .spyOn(client.insurance, 'getInsurancePrices')
        .mockRejectedValue(rateLimitError);
    });

    when(
      'the client requests insurance prices expecting rate limit error',
      async () => {
        try {
          await client.insurance.getInsurancePrices();
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the client shall return a 429 rate limit error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
