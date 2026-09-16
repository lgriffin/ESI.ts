import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  RETRYABLE_ATTEMPTS,
  SEAM_RETRY,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0018-insurance.feature');

const PRICES_PATH = '/insurance/prices';

const TIER_NAMES = [
  'Basic',
  'Standard',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
] as const;

/** One ship type's six-level ladder, each level doubling the previous one. */
function ladder(typeId: number, baseCost: number) {
  return {
    type_id: typeId,
    levels: TIER_NAMES.map((name, i) => ({
      cost: baseCost * Math.pow(2, i),
      name,
      payout: baseCost * 2 * Math.pow(2, i),
    })),
  };
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Frigate and battleship prices with their level lists', ({
    given,
    when,
    then,
  }) => {
    let result: any;
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

    given('the insurance system is operational', () => {
      queueResponse({ match: PRICES_PATH, body: expectedPrices });
    });

    when('the client requests insurance prices', async () => {
      result = await client.insurance.getInsurancePrices();
    });

    then(
      'the client shall return pricing data for available ship types',
      () => {
        const request = lastRequest();
        expect(request.method).toBe('GET');
        expect(request.url.pathname).toMatch(/\/insurance\/prices\/?$/);
        expect(request.headers.authorization).toBeUndefined();
        expect(sentRequests()).toHaveLength(1);

        expect(result).toEqual(expectedPrices);
        expect(result.map((p: any) => p.type_id)).toEqual([587, 29984]);
        expect(result[0].levels[0]).toEqual({
          cost: 10,
          name: 'Basic',
          payout: 20,
        });
        expect(result[1].levels[5]).toEqual({
          cost: 40000000,
          name: 'Platinum',
          payout: 80000000,
        });
      },
    );
  });

  test('Costs and payouts rise with each tier', ({ given, when, then }) => {
    let levels: any;

    given('insurance prices are available for tier verification', () => {
      queueResponse({
        match: PRICES_PATH,
        body: [
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
        ],
      });
    });

    when('the client examines the tiers for a ship type', async () => {
      const result = await client.insurance.getInsurancePrices();
      levels = result[0].levels;
    });

    then('higher tiers shall have increasing costs and payouts', () => {
      expect(levels.map((l: any) => l.cost)).toEqual([
        500000, 1250000, 2500000, 5000000, 10000000, 20000000,
      ]);
      expect(levels.map((l: any) => l.payout)).toEqual([
        1000000, 2500000, 5000000, 10000000, 20000000, 40000000,
      ]);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].cost).toBeGreaterThan(levels[i - 1].cost);
        expect(levels[i].payout).toBeGreaterThan(levels[i - 1].payout);
      }
    });
  });

  test('Payout exceeds cost at every tier', ({ given, when, then }) => {
    let result: any;

    given('insurance prices are available for payout verification', () => {
      queueResponse({
        match: PRICES_PATH,
        body: [
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
        ],
      });
    });

    when('the client checks each tier', async () => {
      result = await client.insurance.getInsurancePrices();
    });

    then('the payout shall always be greater than the cost', () => {
      expect(result).toHaveLength(1);
      expect(result[0].type_id).toBe(17918);
      expect(result[0].levels).toHaveLength(6);
      result.forEach((ship: any) => {
        ship.levels.forEach((level: any) => {
          expect(level.payout).toBeGreaterThan(level.cost);
        });
      });
    });
  });

  test('Five hundred ship types in one response', ({ given, when, then }) => {
    let result: any;
    let startTime: number;
    let endTime: number;

    given('a large insurance dataset covering many ship types', () => {
      queueResponse({
        match: PRICES_PATH,
        body: Array.from({ length: 500 }, (_, i) =>
          ladder(1000 + i, 100.0 * (i + 1)),
        ),
      });
    });

    when('the client processes the large insurance response', async () => {
      startTime = Date.now();
      result = await client.insurance.getInsurancePrices();
      endTime = Date.now();
    });

    then('the client shall handle it efficiently', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result[0].type_id).toBe(1000);
      expect(result[499].type_id).toBe(1499);
      expect(result[499].levels[5]).toEqual({
        cost: 50000 * 32,
        name: 'Platinum',
        payout: 100000 * 32,
      });
      expect(result.every((item: any) => item.levels.length === 6)).toBe(true);
    });
  });

  test('Six named tiers per ship type', ({ given, when, then }) => {
    let result: any;

    given('insurance prices are available for tier count verification', () => {
      queueResponse({
        match: PRICES_PATH,
        body: [ladder(587, 10.0), ladder(24690, 500000.0)],
      });
    });

    when('the client inspects each ship type', async () => {
      result = await client.insurance.getInsurancePrices();
    });

    then('every entry shall contain six named tiers', () => {
      expect(result.map((entry: any) => entry.type_id)).toEqual([587, 24690]);
      result.forEach((entry: any) => {
        expect(entry.levels).toHaveLength(6);
        expect(entry.levels.map((l: any) => l.name)).toEqual(TIER_NAMES);
      });
    });
  });

  test('ESI answering 503', ({ given, when, then }) => {
    let caughtError: any;

    given('the ESI service is temporarily unavailable', () => {
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Service Unavailable', {
        match: PRICES_PATH,
        times: RETRYABLE_ATTEMPTS,
      });
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
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });

  test('ESI answering 429 after the error limit', ({ given, when, then }) => {
    let caughtError: any;

    given('the API rate limit has been exceeded', () => {
      // A 429 blocks the rate-limit group for at least 60 seconds, so a
      // retrying client would sleep through the block before its next
      // attempt. This caller does not retry, which surfaces the rejection
      // on the single 429 exchange.
      client = createSeamClient({
        retryConfig: { ...SEAM_RETRY, maxRetries: 0 },
      });
      queueError(429, 'Too many errors', {
        match: PRICES_PATH,
        headers: { 'x-esi-error-limit-remain': '0' },
      });
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
      expect((caughtError as EsiError).statusCode).toBe(429);
      expect((caughtError as EsiError).isRateLimited()).toBe(true);
      expect(sentRequests()).toHaveLength(1);
    });
  });
});
