import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  createSeamClient,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';
import { timeExecution } from '../shared/performance-helpers';

const feature = loadFeature(
  'tests/bdd/features/performance/0001-performance.feature',
);

/**
 * What these scenarios time, and what they leave to the benchmark tier.
 *
 * Every scenario runs the real request pipeline against the HTTP seam: path
 * building, rate limiter, deduplication, fetch, JSON parsing, the ETag cache,
 * pagination and Zod validation. Network latency is the `delayMs` on each
 * queued response.
 *
 * No scenario asserts how fast the pipeline is. A wall-clock budget loose
 * enough never to fail on a slow runner cannot see a 30% slowdown, and one
 * tight enough to see it fails on a slow runner. Per-path cost is measured by
 * tests/benchmark instead: base against head on one machine, with a
 * statistical decision (`npm run bench:ab`, then `npm run bench:compare`).
 *
 * Two kinds of time bound remain, and neither depends on runner speed:
 * - a lower bound of `delay - EARLY_TIMER_TOLERANCE_MS`. An elapsed time
 *   shorter than the transport delay means the response did not come from the
 *   transport (a cache hit or a stub). Node timers may fire up to a
 *   millisecond early relative to `performance.now()`, so the tolerance is a
 *   few milliseconds, not zero;
 * - for a concurrent group, an upper bound at or above half the time the group
 *   takes sent one after another. Serial dispatch cannot beat it however fast
 *   the machine, and overlapping requests settle near the slowest single
 *   delay, many times below it.
 */
const EARLY_TIMER_TOLERANCE_MS = 5;

/**
 * Jest's default 5 second test timeout for the scenarios whose transport
 * delays or budgets approach it, so an overrun fails on the budget assertion
 * with its measured value rather than as an opaque timeout.
 */
const SCENARIO_TIMEOUT_MS = 20_000;

/**
 * The seam client already sets the rate limiter's minimum request spacing to
 * zero. It is spelled out here because the concurrency Rules depend on it: the
 * library default of 50 milliseconds serialises dispatch, which is a
 * deliberate politeness delay rather than a performance fault.
 */
const NO_SPACING = { rateLimiterConfig: { minDelayMs: 0 } };

/**
 * A JSON body encoded once, up front. The seam JSON-encodes object bodies on
 * every request it serves; for large payloads that is harness cost that would
 * land inside the measured interval, so those scenarios queue the encoded
 * string instead and the interval holds only the client's own work.
 */
function jsonBody(value: unknown) {
  return {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(value),
  };
}

const JITA_REGION = 10000002;
const CORPORATION_ID = 1344654522;
const FIRST_CHARACTER_ID = 1689391488;

/** Deterministic order book so aggregates can be asserted exactly. */
function orderBook(count: number, firstOrderId: number) {
  return Array.from({ length: count }, (_, i) =>
    TestDataFactory.createMarketOrder({
      order_id: firstOrderId + i,
      type_id: 34,
      // Buy side 4.00-4.99, sell side 5.00-5.99.
      price: i % 2 === 0 ? 4 + (i % 100) / 100 : 5 + (i % 100) / 100,
      volume_remain: 1000 + (i % 500),
      is_buy_order: i % 2 === 0,
      location_id: 60003760 + (i % 10),
    }),
  );
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient(NO_SPACING);
  });

  test('Five sequential single-endpoint requests with stubbed latencies of 100 to 300 milliseconds', ({
    given,
    when,
    then,
  }) => {
    const calls = [
      {
        api: 'alliance.getAllianceById',
        match: '/alliances/99005338/',
        delayMs: 200,
        body: TestDataFactory.createAllianceInfo({ alliance_id: 99005338 }),
        call: () => client.alliance.getAllianceById(99005338),
      },
      {
        api: 'characters.getCharacterPublicInfo',
        match: `/characters/${FIRST_CHARACTER_ID}/`,
        delayMs: 150,
        body: TestDataFactory.createCharacterInfo({
          character_id: FIRST_CHARACTER_ID,
        }),
        call: () =>
          client.characters.getCharacterPublicInfo(FIRST_CHARACTER_ID),
      },
      {
        api: 'corporations.getCorporationInfo',
        match: `/corporations/${CORPORATION_ID}`,
        delayMs: 180,
        body: TestDataFactory.createCorporationInfo({
          corporation_id: CORPORATION_ID,
        }),
        call: () => client.corporations.getCorporationInfo(CORPORATION_ID),
      },
      {
        api: 'market.getMarketPrices',
        match: '/markets/prices/',
        delayMs: 300,
        body: [
          TestDataFactory.createMarketPrice({ type_id: 34 }),
          TestDataFactory.createMarketPrice({
            type_id: 35,
            average_price: 11.2,
            adjusted_price: 11.05,
          }),
        ],
        call: () => client.market.getMarketPrices(),
      },
      {
        api: 'universe.getSystemById',
        match: '/universe/systems/30000142',
        delayMs: 100,
        body: TestDataFactory.createSolarSystem({ system_id: 30000142 }),
        call: () => client.universe.getSystemById(30000142),
      },
    ];
    const measured: Array<{ api: string; elapsed: number; result: unknown }> =
      [];

    given('normal system load', () => {
      for (const { match, delayMs, body } of calls) {
        queueResponse({ match, delayMs, body });
      }
    });

    when(
      'the client makes API requests and measure response times',
      async () => {
        for (const { api, call } of calls) {
          const { result, elapsed } = await timeExecution<unknown>(call);
          measured.push({ api, elapsed, result });
        }
      },
    );

    then('each response shall match the body ESI sent', () => {
      expect(sentRequests()).toHaveLength(calls.length);
      calls.forEach((expected, i) => {
        const { api, elapsed, result } = measured[i]!;
        expect(api).toBe(expected.api);
        expect(result).toEqual(expected.body);
        expect(elapsed).toBeGreaterThanOrEqual(
          expected.delayMs - EARLY_TIMER_TOLERANCE_MS,
        );
      });
    });
  });

  test(
    'Stubbed latencies of 50, 200, 500, and 1000 milliseconds',
    ({ given, when, then }) => {
      // A distinct character per condition, so every measurement is its own
      // request and none can be answered by the cache or the deduplicator.
      const networkConditions = [
        { name: 'fast', delay: 50, characterId: FIRST_CHARACTER_ID },
        { name: 'normal', delay: 200, characterId: FIRST_CHARACTER_ID + 1 },
        { name: 'slow', delay: 500, characterId: FIRST_CHARACTER_ID + 2 },
        { name: 'very_slow', delay: 1000, characterId: FIRST_CHARACTER_ID + 3 },
      ];
      const measured: Array<{ name: string; elapsed: number; result: any }> =
        [];

      given('different network latencies', () => {
        for (const { delay, characterId } of networkConditions) {
          queueResponse({
            match: `/characters/${characterId}/`,
            delayMs: delay,
            body: TestDataFactory.createCharacterInfo({
              character_id: characterId,
              name: `Pilot ${characterId}`,
            }),
          });
        }
      });

      when('the client makes requests under different conditions', async () => {
        for (const { name, characterId } of networkConditions) {
          const { result, elapsed } = await timeExecution(() =>
            client.characters.getCharacterPublicInfo(characterId),
          );
          measured.push({ name, elapsed, result });
        }
      });

      then('the client shall wait for each delayed response', () => {
        expect(sentRequests()).toHaveLength(networkConditions.length);
        networkConditions.forEach(({ name, delay, characterId }, i) => {
          const m = measured[i]!;
          expect(m.name).toBe(name);
          expect(m.result.character_id).toBe(characterId);
          expect(m.result.name).toBe(`Pilot ${characterId}`);
          expect(m.elapsed).toBeGreaterThanOrEqual(
            delay - EARLY_TIMER_TOLERANCE_MS,
          );
        });
      });
    },
    SCENARIO_TIMEOUT_MS,
  );

  test('Fifty concurrent character lookups each stubbed at 100 milliseconds', ({
    given,
    when,
    then,
  }) => {
    const concurrentRequests = 50;
    const characterIds = Array.from(
      { length: concurrentRequests },
      (_, i) => FIRST_CHARACTER_ID + i,
    );
    let results: any[];
    let totalTime: number;

    given('high concurrent load', () => {
      for (const id of characterIds) {
        queueResponse({
          match: `/characters/${id}/`,
          delayMs: 100,
          body: TestDataFactory.createCharacterInfo({
            character_id: id,
            name: `Character ${id}`,
          }),
        });
      }
    });

    when('the client makes simultaneous requests', async () => {
      const timed = await timeExecution(() =>
        Promise.all(
          characterIds.map((id) =>
            client.characters.getCharacterPublicInfo(id),
          ),
        ),
      );
      results = timed.result;
      totalTime = timed.elapsed;
    });

    then('the requests shall overlap rather than run one after another', () => {
      expect(sentRequests()).toHaveLength(concurrentRequests);
      expect(results.map((r) => r.character_id)).toEqual(characterIds);
      expect(results.map((r) => r.name)).toEqual(
        characterIds.map((id) => `Character ${id}`),
      );
      // Serial dispatch takes at least 50 x 100 = 5000 ms, and two requests in
      // flight at a time at least 2500. Overlapping, the group settles near
      // 110 ms.
      expect(totalTime).toBeGreaterThanOrEqual(100 - EARLY_TIMER_TOLERANCE_MS);
      expect(totalTime).toBeLessThan(2500);
    });
  });

  test('Alliance, character, corporation, system, and market calls issued together', ({
    given,
    when,
    then,
  }) => {
    const alliance = TestDataFactory.createAllianceInfo({
      alliance_id: 99005338,
    });
    const character = TestDataFactory.createCharacterInfo({
      character_id: FIRST_CHARACTER_ID,
    });
    const corporation = TestDataFactory.createCorporationInfo({
      corporation_id: CORPORATION_ID,
    });
    const system = TestDataFactory.createSolarSystem({ system_id: 30000142 });
    const prices = [TestDataFactory.createMarketPrice({ type_id: 34 })];
    let results: any[];
    let totalTime: number;

    given('mixed API types for concurrent requests', () => {
      queueResponse({
        match: '/alliances/99005338/',
        delayMs: 120,
        body: alliance,
      });
      queueResponse({
        match: `/characters/${FIRST_CHARACTER_ID}/`,
        delayMs: 100,
        body: character,
      });
      queueResponse({
        match: `/corporations/${CORPORATION_ID}`,
        delayMs: 150,
        body: corporation,
      });
      queueResponse({
        match: '/universe/systems/30000142',
        delayMs: 80,
        body: system,
      });
      queueResponse({ match: '/markets/prices/', delayMs: 200, body: prices });
    });

    when(
      'the client makes concurrent requests across different APIs',
      async () => {
        const timed = await timeExecution(() =>
          Promise.all<unknown>([
            client.alliance.getAllianceById(99005338),
            client.characters.getCharacterPublicInfo(FIRST_CHARACTER_ID),
            client.corporations.getCorporationInfo(CORPORATION_ID),
            client.universe.getSystemById(30000142),
            client.market.getMarketPrices(),
          ]),
        );
        results = timed.result;
        totalTime = timed.elapsed;
      },
    );

    then('all mixed requests shall complete successfully', () => {
      expect(sentRequests()).toHaveLength(5);
      expect(results).toEqual([
        alliance,
        character,
        corporation,
        system,
        prices,
      ]);
      // The five legs sum to 650 ms, so sent one after another they cannot
      // settle sooner; overlapping, they settle near the 200 ms slowest leg.
      expect(totalTime).toBeGreaterThanOrEqual(200 - EARLY_TIMER_TOLERANCE_MS);
      expect(totalTime).toBeLessThan(650);
    });
  });

  test('Ten thousand market orders filtered and aggregated', ({
    given,
    when,
    then,
  }) => {
    // ESI serves region orders 1000 per page, so a 10000-order book is ten
    // pages fetched in sequence and concatenated by the pagination handler.
    const pageSize = 1000;
    const pageCount = 10;
    const largeOrderCount = pageSize * pageCount;
    const allOrders = orderBook(largeOrderCount, 5000000001);
    let orders: any[];
    let summary: {
      buyCount: number;
      sellCount: number;
      bestBuyPrice: number;
      bestSellPrice: number;
      totalVolume: number;
      locationCounts: Record<string, number>;
    };

    given('large market data', () => {
      for (let page = 1; page <= pageCount; page++) {
        queueResponse({
          // Page 1 is the unparameterised request; later pages add page=N.
          match:
            page === 1
              ? new RegExp(`/markets/${JITA_REGION}/orders/\\?order_type=all$`)
              : `page=${page}`,
          body: JSON.stringify(
            allOrders.slice((page - 1) * pageSize, page * pageSize),
          ),
          headers: {
            'content-type': 'application/json',
            'x-pages': String(pageCount),
          },
        });
      }
    });

    when('the client processes the market dataset', async () => {
      orders = await client.market.getMarketOrders(JITA_REGION);

      let bestBuyPrice = -Infinity;
      let bestSellPrice = Infinity;
      let buyCount = 0;
      let totalVolume = 0;
      const locationCounts: Record<string, number> = {};
      for (const order of orders) {
        if (order.is_buy_order) {
          buyCount++;
          bestBuyPrice = Math.max(bestBuyPrice, order.price);
        } else {
          bestSellPrice = Math.min(bestSellPrice, order.price);
        }
        totalVolume += order.volume_remain;
        locationCounts[order.location_id] =
          (locationCounts[order.location_id] ?? 0) + 1;
      }
      summary = {
        buyCount,
        sellCount: orders.length - buyCount,
        bestBuyPrice,
        bestSellPrice,
        totalVolume,
        locationCounts,
      };
    });

    then('every page shall be fetched once and every order returned', () => {
      const requests = sentRequests();
      expect(requests).toHaveLength(pageCount);
      expect(requests.map((r) => r.url.searchParams.get('page'))).toEqual([
        null,
        ...Array.from({ length: pageCount - 1 }, (_, i) => String(i + 2)),
      ]);

      expect(orders).toHaveLength(largeOrderCount);
      expect(orders.map((o) => o.order_id)).toEqual(
        allOrders.map((o) => o.order_id),
      );

      expect(summary.buyCount).toBe(5000);
      expect(summary.sellCount).toBe(5000);
      expect(summary.bestBuyPrice).toBeCloseTo(4.98, 10);
      expect(summary.bestSellPrice).toBeCloseTo(5.01, 10);
      expect(summary.totalVolume).toBe(
        allOrders.reduce((sum, o) => sum + o.volume_remain, 0),
      );
      expect(Object.values(summary.locationCounts)).toEqual(
        Array.from({ length: 10 }, () => 1000),
      );
    });
  });

  test('Five thousand member identifiers with one hundred role records', ({
    given,
    when,
    then,
  }) => {
    const largeMemberCount = 5000;
    const memberIds = Array.from(
      { length: largeMemberCount },
      (_, i) => FIRST_CHARACTER_ID + i,
    );
    // 10 directors, 40 personnel managers, 50 members holding no roles.
    const memberRoles = Array.from({ length: 100 }, (_, i) => {
      let roles: string[] = [];
      if (i < 10) roles = ['Director'];
      else if (i < 50) roles = ['Personnel_Manager'];
      return TestDataFactory.createCorporationMemberRoles({
        character_id: FIRST_CHARACTER_ID + i,
        roles,
        grantable_roles: [],
        roles_at_hq: [],
      });
    });
    let members: number[];
    let directors: number;
    let managers: number;
    let withoutRoles: number;

    given('a large corporation', () => {
      queueResponse({
        match: new RegExp(`/corporations/${CORPORATION_ID}/members$`),
        ...jsonBody(memberIds),
      });
      queueResponse({
        match: new RegExp(`/corporations/${CORPORATION_ID}/roles$`),
        ...jsonBody(memberRoles),
      });
    });

    when('the client processes member data', async () => {
      const [fetchedMembers, roles] = await Promise.all([
        client.corporations.getCorporationMembers(CORPORATION_ID),
        client.corporations.getCorporationRoles(CORPORATION_ID),
      ]);
      const has = (role: string) =>
        roles.filter((m) => m.roles?.includes(role)).length;
      members = fetchedMembers;
      directors = has('Director');
      managers = has('Personnel_Manager');
      withoutRoles = roles.filter((m) => (m.roles ?? []).length === 0).length;
    });

    then('both lists shall be returned complete', () => {
      const requests = sentRequests();
      expect(requests).toHaveLength(2);
      for (const request of requests) {
        expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      }

      expect(members).toEqual(memberIds);
      expect(directors).toBe(10);
      expect(managers).toBe(40);
      expect(withoutRoles).toBe(50);
    });
  });

  test(
    'One hundred sequential reads of a thousand-order dataset',
    ({ given, when, then }) => {
      const iterations = 100;
      const datasetSize = 1000;
      const dataset = orderBook(datasetSize, 6000000001);
      const expectedAverage =
        dataset.reduce((sum, o) => sum + o.price, 0) / datasetSize;
      const summaries: Array<{ orderCount: number; averagePrice: number }> = [];

      given('memory-intensive operations', () => {
        // No ETag, so nothing is cached and every read is a full fetch, JSON
        // parse and Zod validation of 1000 orders.
        queueResponse({
          match: `/markets/${JITA_REGION}/orders/`,
          headers: { 'content-type': 'application/json', 'x-pages': '1' },
          body: JSON.stringify(dataset),
          times: iterations,
        });
      });

      when(
        'the client processes large amounts of data iteratively',
        async () => {
          for (let i = 0; i < iterations; i++) {
            const orders = await client.market.getMarketOrders(JITA_REGION);
            summaries.push({
              orderCount: orders.length,
              averagePrice:
                orders.reduce((sum, order) => sum + order.price, 0) /
                orders.length,
            });
          }
        },
      );

      then('every read shall return the same complete dataset', () => {
        expect(sentRequests()).toHaveLength(iterations);
        expect(summaries).toHaveLength(iterations);

        const first = summaries[0]!;
        const last = summaries[iterations - 1]!;
        expect(first.orderCount).toBe(datasetSize);
        expect(last.orderCount).toBe(datasetSize);
        expect(first.averagePrice).toBeCloseTo(expectedAverage, 10);
        expect(last.averagePrice).toBeCloseTo(first.averagePrice, 10);
      });
    },
    SCENARIO_TIMEOUT_MS,
  );

  test('Six of twenty concurrent lookups reject with a 500 error', ({
    given,
    when,
    then,
  }) => {
    const totalRequests = 20;
    const characterIds = Array.from(
      { length: totalRequests },
      (_, i) => FIRST_CHARACTER_ID + i,
    );
    const failing = (id: number) => id % 10 < 3;
    let results: Array<{ id: number; value?: any; error?: unknown }>;
    let totalTime: number;

    given('error conditions exist', () => {
      for (const id of characterIds) {
        const match = `/characters/${id}/`;
        if (failing(id)) {
          // 500 is not retried, so each failing lookup is one request.
          queueError(500, 'Internal Server Error', { match, delayMs: 100 });
        } else {
          queueResponse({
            match,
            delayMs: 100,
            body: TestDataFactory.createCharacterInfo({ character_id: id }),
          });
        }
      }
    });

    when('errors occur during requests', async () => {
      const timed = await timeExecution(() =>
        Promise.all(
          characterIds.map((id) =>
            client.characters.getCharacterPublicInfo(id).then(
              (value) => ({ id, value }),
              (error: unknown) => ({ id, error }),
            ),
          ),
        ),
      );
      results = timed.result;
      totalTime = timed.elapsed;
    });

    then('failed requests shall settle alongside successful ones', () => {
      expect(sentRequests()).toHaveLength(totalRequests);

      const errors = results.filter((r) => r.error !== undefined);
      const successes = results.filter((r) => r.error === undefined);
      expect(errors.map((r) => r.id)).toEqual(characterIds.filter(failing));
      expect(errors).toHaveLength(6);
      expect(successes.map((r) => r.value.character_id)).toEqual(
        characterIds.filter((id) => !failing(id)),
      );
      for (const { error } of errors) {
        expect(error).toBeInstanceOf(EsiError);
        expect((error as EsiError).statusCode).toBe(500);
      }

      // One after another, 20 x 100 ms is at least 2000; the bound is half.
      // Overlapping, the group settles near 110 ms.
      expect(totalTime).toBeGreaterThanOrEqual(100 - EARLY_TIMER_TOLERANCE_MS);
      expect(totalTime).toBeLessThan(1000);
    });
  });
});
