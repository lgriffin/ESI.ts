import fetchMock from 'jest-fetch-mock';
import { z } from 'zod';
import { BaseEsiClient } from '../../../src/clients/BaseEsiClient';
import { ApiClient } from '../../../src/core/ApiClient';
import type { EndpointMap } from '../../../src/core/endpoints/EndpointDefinition';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { logCalls, spyLogger } from '../helpers/spyLogger';

fetchMock.enableMocks();

const endpoints = {
  getOldItems: {
    path: 'old/{regionId}/items/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    responseSchema: z.array(z.number()),
    deprecated: {
      message: 'Items moved.',
      replacedBy: 'getNewItems',
      sunsetDate: '2027-01-01',
    },
  },
  getNewItems: {
    path: 'new/{regionId}/items/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    responseSchema: z.array(z.number()),
  },
} as const satisfies EndpointMap;

class ItemsClient extends BaseEsiClient<typeof endpoints> {
  constructor(client: ApiClient) {
    super(client, endpoints);
  }
}

const WARNING =
  "Endpoint 'getOldItems' is deprecated. Items moved. Use 'getNewItems' instead. Sunset date: 2027-01-01.";

// The page helpers warn as the direct methods do (createClient), and as
// createEsi's paginate does, once per call.
describe('BaseEsiClient page helpers on a deprecated endpoint (ARCH-08)', () => {
  let client: ApiClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', 'https://esi.evetech.net');
    client.setRateLimiter(rateLimiter);
  });

  afterEach(() => rateLimiter.setTestMode(false));

  const warnings = (logger: ReturnType<typeof spyLogger>) =>
    logCalls(logger).filter(([level]) => level === 'warn');

  it('streamEndpoint logs one warning per call, naming the endpoint', async () => {
    const logger = spyLogger();
    client.setLogger(logger);
    fetchMock.mockResponseOnce(JSON.stringify([1, 2]), {
      headers: { 'x-pages': '2' },
    });
    fetchMock.mockResponseOnce(JSON.stringify([3]), {
      headers: { 'x-pages': '2' },
    });
    const items: number[] = [];
    for await (const page of new ItemsClient(client).streamEndpoint<number>(
      'getOldItems',
      10000002,
    )) {
      items.push(...page.data);
    }
    expect(items).toEqual([1, 2, 3]);
    expect(warnings(logger)).toEqual([
      ['warn', WARNING, { endpoint: 'getOldItems' }],
    ]);
  });

  it('fetchAllEndpoint logs one warning per call, naming the endpoint', async () => {
    const logger = spyLogger();
    client.setLogger(logger);
    fetchMock.mockResponseOnce(JSON.stringify([1]));
    await expect(
      new ItemsClient(client).fetchAllEndpoint<number>('getOldItems', [1]),
    ).resolves.toEqual([1]);
    expect(warnings(logger)).toEqual([
      ['warn', WARNING, { endpoint: 'getOldItems' }],
    ]);
  });

  it('logs nothing for an endpoint that is not deprecated', async () => {
    const logger = spyLogger();
    client.setLogger(logger);
    fetchMock.mockResponseOnce(JSON.stringify([1]));
    await new ItemsClient(client).fetchAllEndpoint<number>('getNewItems', [1]);
    fetchMock.mockResponseOnce(JSON.stringify([1]));
    for await (const page of new ItemsClient(client).streamEndpoint<number>(
      'getNewItems',
      1,
    )) {
      expect(page.data).toEqual([1]);
    }
    expect(warnings(logger)).toEqual([]);
  });
});
