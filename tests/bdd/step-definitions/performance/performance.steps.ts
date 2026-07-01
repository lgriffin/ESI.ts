import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature(
  'tests/bdd/features/performance/performance.feature',
);

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-performance-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 30000,
    });
  });

  test('The client shall benchmark API response times', ({
    given,
    when,
    then,
  }) => {
    let results: any[] = [];

    given('normal system load', () => {
      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return TestDataFactory.createAllianceInfo({
            alliance_id: 99005338,
          });
        });
      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          return TestDataFactory.createCharacterInfo({
            character_id: 1689391488,
          });
        });
      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 180));
          return TestDataFactory.createCorporationInfo({
            corporation_id: 1344654522,
          });
        });
      jest
        .spyOn(client.market, 'getMarketPrices')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return [TestDataFactory.createMarketPrice({ type_id: 34 })];
        });
      jest
        .spyOn(client.universe, 'getSystemById')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return TestDataFactory.createSolarSystem({ system_id: 30000142 });
        });
    });

    when(
      'the client makes API requests and measure response times',
      async () => {
        const testCases = [
          {
            client: 'alliance',
            method: 'getAllianceById',
            args: [99005338],
            expectedMaxTime: 2000,
          },
          {
            client: 'characters',
            method: 'getCharacterPublicInfo',
            args: [1689391488],
            expectedMaxTime: 1500,
          },
          {
            client: 'corporations',
            method: 'getCorporationInfo',
            args: [1344654522],
            expectedMaxTime: 1500,
          },
          {
            client: 'market',
            method: 'getMarketPrices',
            args: [],
            expectedMaxTime: 3000,
          },
          {
            client: 'universe',
            method: 'getSystemById',
            args: [30000142],
            expectedMaxTime: 1000,
          },
        ];

        results = [];
        for (const testCase of testCases) {
          const startTime = Date.now();

          const apiClient = (client as any)[testCase.client];
          await apiClient[testCase.method](...testCase.args);

          const endTime = Date.now();
          const responseTime = endTime - startTime;

          results.push({
            api: `${testCase.client}.${testCase.method}`,
            responseTime,
            expectedMaxTime: testCase.expectedMaxTime,
          });
        }
      },
    );

    then('response times shall be within acceptable limits', () => {
      results.forEach((result) => {
        expect(result.responseTime).toBeLessThan(result.expectedMaxTime);
        expect(result.responseTime).toBeGreaterThan(50);
      });

      const averageResponseTime =
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      expect(averageResponseTime).toBeLessThan(500);
    });
  });

  test('The client shall perform under varying network conditions', ({
    given,
    when,
    then,
  }) => {
    let results: any[] = [];
    const networkConditions = [
      { name: 'fast', delay: 50 },
      { name: 'normal', delay: 200 },
      { name: 'slow', delay: 500 },
      { name: 'very_slow', delay: 1000 },
    ];

    given('different network latencies', () => {
      // Setup will be done per condition in the when step
    });

    when('the client makes requests under different conditions', async () => {
      results = [];

      for (const condition of networkConditions) {
        jest
          .spyOn(client.characters, 'getCharacterPublicInfo')
          .mockImplementation(async () => {
            await new Promise((resolve) =>
              setTimeout(resolve, condition.delay),
            );
            return TestDataFactory.createCharacterInfo({
              character_id: 1689391488,
            });
          });

        const startTime = Date.now();
        const result =
          await client.characters.getCharacterPublicInfo(1689391488);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results.push({
          condition: condition.name,
          expectedDelay: condition.delay,
          actualResponseTime: responseTime,
        });

        expect(result).toBeDefined();
      }
    });

    then('the client shall handle varying conditions gracefully', () => {
      results.forEach((result) => {
        expect(result.actualResponseTime).toBeGreaterThanOrEqual(
          result.expectedDelay - 5,
        );
        expect(result.actualResponseTime).toBeLessThan(
          result.expectedDelay + 150,
        );
      });

      const fastResponse = results.find((r) => r.condition === 'fast')!;
      const slowResponse = results.find((r) => r.condition === 'very_slow')!;
      expect(slowResponse.actualResponseTime).toBeGreaterThan(
        fastResponse.actualResponseTime * 5,
      );
    });
  });

  test('The client shall handle high concurrency load', ({
    given,
    when,
    then,
  }) => {
    let results: any[];
    let totalTime: number;
    const concurrentRequests = 50;
    const characterIds = Array.from(
      { length: concurrentRequests },
      (_, i) => 1689391488 + i,
    );

    given('high concurrent load', () => {
      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockImplementation(async (id: number) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return TestDataFactory.createCharacterInfo({
            character_id: id,
            name: `Character ${id}`,
          });
        });
    });

    when('the client makes simultaneous requests', async () => {
      const startTime = Date.now();
      const promises = characterIds.map((id) =>
        client.characters.getCharacterPublicInfo(id),
      );
      results = await Promise.all(promises);
      const endTime = Date.now();
      totalTime = endTime - startTime;
    });

    then('the client shall handle them efficiently', () => {
      expect(results).toHaveLength(concurrentRequests);
      expect(totalTime).toBeLessThan(1000);

      results.forEach((result, index) => {
        expect(result.character_id).toBe(characterIds[index]);
        expect(result.name).toBe(`Character ${characterIds[index]}`);
      });

      const theoreticalSequentialTime = concurrentRequests * 100;
      const efficiencyRatio = theoreticalSequentialTime / totalTime;
      expect(efficiencyRatio).toBeGreaterThan(10);
    });
  });

  test('The client shall handle mixed API concurrent requests', ({
    given,
    when,
    then,
  }) => {
    let results: any[];
    let totalTime: number;

    given('mixed API types for concurrent requests', () => {
      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockImplementation(async (id) => {
          await new Promise((resolve) => setTimeout(resolve, 120));
          return TestDataFactory.createAllianceInfo({ alliance_id: id });
        });
      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockImplementation(async (id) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return TestDataFactory.createCharacterInfo({ character_id: id });
        });
      jest
        .spyOn(client.corporations, 'getCorporationInfo')
        .mockImplementation(async (id) => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          return TestDataFactory.createCorporationInfo({
            corporation_id: id,
          });
        });
      jest
        .spyOn(client.universe, 'getSystemById')
        .mockImplementation(async (id) => {
          await new Promise((resolve) => setTimeout(resolve, 80));
          return TestDataFactory.createSolarSystem({ system_id: id });
        });
      jest
        .spyOn(client.market, 'getMarketPrices')
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return [TestDataFactory.createMarketPrice({ type_id: 34 })];
        });
    });

    when(
      'the client makes concurrent requests across different APIs',
      async () => {
        const mixedRequests = [
          { type: 'alliance', id: 99005338 },
          { type: 'character', id: 1689391488 },
          { type: 'corporation', id: 1344654522 },
          { type: 'system', id: 30000142 },
          { type: 'market', id: null },
        ];

        const startTime = Date.now();
        const promises = mixedRequests.map((request) => {
          switch (request.type) {
            case 'alliance':
              return client.alliance.getAllianceById(request.id!);
            case 'character':
              return client.characters.getCharacterPublicInfo(request.id!);
            case 'corporation':
              return client.corporations.getCorporationInfo(request.id!);
            case 'system':
              return client.universe.getSystemById(request.id!);
            case 'market':
              return client.market.getMarketPrices();
            default:
              throw new Error('Unknown request type');
          }
        });

        results = await Promise.all(promises);
        const endTime = Date.now();
        totalTime = endTime - startTime;
      },
    );

    then('all mixed requests shall complete successfully', () => {
      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(500);

      expect(results[0]).toHaveProperty('alliance_id');
      expect(results[1]).toHaveProperty('character_id');
      expect(results[2]).toHaveProperty('corporation_id');
      expect(results[3]).toHaveProperty('system_id');
      expect(results[4]).toBeInstanceOf(Array);

      expect(totalTime).toBeLessThan(350);
    });
  });

  test('The client shall process large market datasets', ({
    given,
    when,
    then,
  }) => {
    let orders: any;
    let processingTime: number;
    const largeOrderCount = 10000;

    given('large market data', () => {
      const largeOrderSet = Array.from({ length: largeOrderCount }, (_, i) =>
        TestDataFactory.createMarketOrder({
          order_id: 5000000001 + i,
          type_id: 34,
          price: 4.0 + Math.random() * 2,
          volume_remain: Math.floor(Math.random() * 1000000),
          is_buy_order: Math.random() > 0.5,
          location_id: 60003760 + (i % 10),
        }),
      );

      jest
        .spyOn(client.market, 'getMarketOrders')
        .mockResolvedValue(largeOrderSet);
    });

    when('the client processes the market dataset', async () => {
      const startTime = Date.now();
      orders = await client.market.getMarketOrders(10000002);

      const buyOrders = orders.filter((order: any) => order.is_buy_order);
      const sellOrders = orders.filter((order: any) => !order.is_buy_order);
      const bestBuyPrice = Math.max(
        ...buyOrders.map((order: any) => order.price),
      );
      const bestSellPrice = Math.min(
        ...sellOrders.map((order: any) => order.price),
      );
      const totalVolume = orders.reduce(
        (sum: any, order: any) => sum + order.volume_remain,
        0,
      );
      const locationCounts = orders.reduce(
        (acc: any, order: any) => {
          acc[order.location_id] = (acc[order.location_id] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      const endTime = Date.now();
      processingTime = endTime - startTime;
    });

    then('performance shall remain acceptable', () => {
      expect(orders.length).toBe(largeOrderCount);
      expect(processingTime).toBeLessThan(2000);

      const buyOrders = orders.filter((order: any) => order.is_buy_order);
      const sellOrders = orders.filter((order: any) => !order.is_buy_order);
      expect(buyOrders.length + sellOrders.length).toBe(largeOrderCount);

      const bestBuyPrice = Math.max(
        ...buyOrders.map((order: any) => order.price),
      );
      const bestSellPrice = Math.min(
        ...sellOrders.map((order: any) => order.price),
      );
      const totalVolume = orders.reduce(
        (sum: any, order: any) => sum + order.volume_remain,
        0,
      );
      const locationCounts = orders.reduce(
        (acc: any, order: any) => {
          acc[order.location_id] = (acc[order.location_id] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      expect(bestBuyPrice).toBeGreaterThan(0);
      expect(bestSellPrice).toBeGreaterThan(0);
      expect(totalVolume).toBeGreaterThan(0);
      expect(Object.keys(locationCounts)).toHaveLength(10);

      const ordersPerSecond = largeOrderCount / (processingTime / 1000);
      expect(ordersPerSecond).toBeGreaterThan(5000);
    });
  });

  test('The client shall handle large corporation member lists', ({
    given,
    when,
    then,
  }) => {
    let members: any;
    let roles: any;
    let processingTime: number;
    const largeMemberCount = 5000;

    given('a large corporation', () => {
      const largeMemberList = Array.from(
        { length: largeMemberCount },
        (_, i) => 1689391488 + i,
      );
      const memberRoles = Array.from({ length: 100 }, (_, i) =>
        TestDataFactory.createCorporationMemberRoles({
          character_id: 1689391488 + i,
          roles:
            i < 10 ? ['Director'] : i < 50 ? ['Personnel_Manager'] : ['Member'],
        }),
      );

      jest
        .spyOn(client.corporations, 'getCorporationMembers')
        .mockResolvedValue(largeMemberList);
      jest
        .spyOn(client.corporations, 'getCorporationRoles')
        .mockResolvedValue(memberRoles);
    });

    when('the client processes member data', async () => {
      const startTime = Date.now();
      [members, roles] = await Promise.all([
        client.corporations.getCorporationMembers(1344654522),
        client.corporations.getCorporationRoles(1344654522),
      ]);

      const directors = roles.filter((member: any) =>
        member.roles.includes('Director'),
      );
      const managers = roles.filter((member: any) =>
        member.roles.includes('Personnel_Manager'),
      );
      const regularMembers = roles.filter(
        (member: any) =>
          member.roles.includes('Member') && member.roles.length === 1,
      );

      const endTime = Date.now();
      processingTime = endTime - startTime;
    });

    then('performance shall scale appropriately', () => {
      expect(members.length).toBe(largeMemberCount);
      expect(processingTime).toBeLessThan(1500);

      const directors = roles.filter((member: any) =>
        member.roles.includes('Director'),
      );
      const managers = roles.filter((member: any) =>
        member.roles.includes('Personnel_Manager'),
      );
      const regularMembers = roles.filter(
        (member: any) =>
          member.roles.includes('Member') && member.roles.length === 1,
      );

      expect(directors.length).toBe(10);
      expect(managers.length).toBe(40);
      expect(regularMembers.length).toBe(50);
      expect(members.length).toBe(largeMemberCount);

      const membersPerSecond = largeMemberCount / (processingTime / 1000);
      expect(membersPerSecond).toBeGreaterThan(3000);
    });
  });

  test('The client shall maintain memory efficiency with large datasets', ({
    given,
    when,
    then,
  }) => {
    let results: any[] = [];
    let totalTime: number;
    const iterations = 100;
    const datasetSize = 1000;

    given('memory-intensive operations', () => {
      const mockDataset = Array.from({ length: datasetSize }, (_, i) =>
        TestDataFactory.createMarketOrder({
          order_id: i,
          price: Math.random() * 100,
        }),
      );

      jest
        .spyOn(client.market, 'getMarketOrders')
        .mockResolvedValue(mockDataset);
    });

    when('the client processes large amounts of data iteratively', async () => {
      const startTime = Date.now();
      results = [];

      for (let i = 0; i < iterations; i++) {
        const orders = await client.market.getMarketOrders(10000002);

        const summary = {
          iteration: i,
          orderCount: orders.length,
          averagePrice:
            orders.reduce((sum: any, order: any) => sum + order.price, 0) /
            orders.length,
          maxPrice: Math.max(...orders.map((order: any) => order.price)),
          minPrice: Math.min(...orders.map((order: any) => order.price)),
        };

        results.push(summary);
      }

      const endTime = Date.now();
      totalTime = endTime - startTime;
    });

    then('memory usage shall remain efficient', () => {
      expect(results.length).toBe(iterations);
      expect(totalTime).toBeLessThan(5000);

      const firstIteration = results[0];
      const lastIteration = results[iterations - 1];

      expect(firstIteration.orderCount).toBe(datasetSize);
      expect(lastIteration.orderCount).toBe(datasetSize);
      expect(firstIteration.averagePrice).toBeCloseTo(
        lastIteration.averagePrice,
        2,
      );

      const avgTimePerIteration = totalTime / iterations;
      expect(avgTimePerIteration).toBeLessThan(50);
    });
  });

  test('IF performance impact of error conditions, THEN the client shall handle it gracefully', ({
    given,
    when,
    then,
  }) => {
    let results: any[];
    let totalTime: number;
    const totalRequests = 20;

    given('error conditions exist', () => {
      jest
        .spyOn(client.characters, 'getCharacterPublicInfo')
        .mockImplementation(async (id: number) => {
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (id % 10 < 3) {
            throw TestDataFactory.createError(500);
          }

          return TestDataFactory.createCharacterInfo({ character_id: id });
        });
    });

    when('errors occur during requests', async () => {
      const startTime = Date.now();
      const promises = Array.from({ length: totalRequests }, (_, i) =>
        client.characters
          .getCharacterPublicInfo(1689391488 + i)
          .catch((error) => ({ error: true, details: error })),
      );

      results = await Promise.all(promises);
      const endTime = Date.now();
      totalTime = endTime - startTime;
    });

    then('error handling shall not significantly impact performance', () => {
      const errors = results.filter((result: any) => result.error);
      const successes = results.filter((result: any) => !result.error);

      const expectedErrors = Array.from(
        { length: totalRequests },
        (_, i) => 1689391488 + i,
      ).filter((id) => id % 10 < 3).length;

      expect(errors.length).toBe(expectedErrors);
      expect(successes.length).toBe(totalRequests - expectedErrors);
      expect(totalTime).toBeLessThan(1000);

      const avgTimePerRequest = totalTime / totalRequests;
      expect(avgTimePerRequest).toBeLessThan(150);

      errors.forEach((errorResult: any) => {
        expect(errorResult.details).toBeInstanceOf(EsiError);
      });
    });
  });
});
