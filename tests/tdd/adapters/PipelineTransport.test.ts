import fetchMock from 'jest-fetch-mock';
import { PipelineTransport } from '../../../src/adapters/PipelineTransport';
import { ApiClient } from '../../../src/core/ApiClient';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { EsiError, EsiValidationError } from '../../../src/core/util/error';
import type { OperationMeta } from '../../../src/core/ports/OperationTransport';
import {
  getMarketsRegionIdOrders,
  getStatus,
} from '../../../src/generated/operations.generated';
import { marketOrder, STATUS, without } from '../helpers/generatedBodies';

fetchMock.enableMocks();

const meta = (over: Partial<OperationMeta>): OperationMeta => ({
  operationId: 'Test',
  method: 'GET',
  path: '/things/{thing_id}',
  scopes: [],
  pagination: 'none',
  deprecated: false,
  headers: [],
  ...over,
});

function newClient(token?: string): ApiClient {
  const client = new ApiClient(
    'pipeline-transport-test',
    'https://esi.evetech.net',
    token,
  );
  const limiter = new RateLimiter();
  limiter.setTestMode(true);
  client.setRateLimiter(limiter);
  return client;
}

const sent = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i]!;
  return {
    url: new URL(String(url)),
    init: init!,
    headers: new Headers(init!.headers),
  };
};

describe('PipelineTransport', () => {
  beforeEach(() => fetchMock.resetMocks());

  describe('request', () => {
    it('fills the path template and returns the parsed body', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ id: 7 }));
      const transport = new PipelineTransport(newClient());

      const body = await transport.request(meta({}), {
        path: { thing_id: 7 },
        query: {},
      });

      expect(body).toEqual({ id: 7 });
      expect(sent().url.pathname).toBe('/things/7');
      expect(sent().init.method).toBe('GET');
    });

    it('drops undefined query values and joins arrays with commas', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([]));
      const transport = new PipelineTransport(newClient());

      await transport.request(meta({ path: '/search' }), {
        path: {},
        query: {
          search: 'Jita IV',
          categories: ['station', 'solar_system'],
          strict: undefined,
        },
      });

      const { url } = sent();
      expect(url.searchParams.get('search')).toBe('Jita IV');
      expect(url.searchParams.get('categories')).toBe('station,solar_system');
      expect(url.searchParams.has('strict')).toBe(false);
      expect(url.search).toContain('search=Jita%20IV');
    });

    it('encodes a path value and rejects a dot segment before any request', async () => {
      const transport = new PipelineTransport(newClient());

      await expect(
        transport.request(meta({}), { path: { thing_id: '..' }, query: {} }),
      ).rejects.toThrow('dot segment');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a non-finite number in a query value before any request', async () => {
      const transport = new PipelineTransport(newClient());

      await expect(
        transport.request(meta({ path: '/search' }), {
          path: {},
          query: { type_id: Number.NaN },
        }),
      ).rejects.toThrow("Query parameter 'type_id' must be a finite number");
      await expect(
        transport.request(meta({ path: '/search' }), {
          path: {},
          query: { type_ids: [34, Number.POSITIVE_INFINITY] },
        }),
      ).rejects.toThrow("Query parameter 'type_ids' must be a finite number");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a path template whose parameter was not supplied', async () => {
      const transport = new PipelineTransport(newClient());

      await expect(
        transport.request(meta({}), { path: {}, query: {} }),
      ).rejects.toThrow("Path parameter 'thing_id' must not be empty");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends the access token only when the operation needs a scope', async () => {
      fetchMock.mockResponse(JSON.stringify({}));
      const transport = new PipelineTransport(newClient('the-token'));

      await transport.request(meta({ path: '/public/{thing_id}' }), {
        path: { thing_id: 1 },
        query: {},
      });
      await transport.request(
        meta({ path: '/private/{thing_id}', scopes: ['esi-things.read.v1'] }),
        { path: { thing_id: 1 }, query: {} },
      );

      expect(sent(0).headers.has('Authorization')).toBe(false);
      expect(sent(1).headers.get('Authorization')).toBe('Bearer the-token');
    });

    it('sends a request body as JSON', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([{ id: 1, name: 'Jita' }]));
      const transport = new PipelineTransport(newClient());

      await transport.request(
        meta({ method: 'POST', path: '/universe/names' }),
        {
          path: {},
          query: {},
          body: [30000142],
        },
      );

      expect(sent().init.method).toBe('POST');
      expect(JSON.parse(String(sent().init.body))).toEqual([30000142]);
    });

    it('surfaces an error status as EsiError', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not found' }), {
        status: 404,
      });
      const transport = new PipelineTransport(newClient());

      const failure = transport.request(meta({}), {
        path: { thing_id: 1 },
        query: {},
      });

      await expect(failure).rejects.toBeInstanceOf(EsiError);
      await expect(failure).rejects.toMatchObject({ statusCode: 404 });
    });

    it('backs a generated operation', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(STATUS));

      const status = await getStatus(new PipelineTransport(newClient()));

      expect(status.players).toBe(1);
      expect(sent().url.pathname).toBe('/status');
    });
  });

  describe('response validation', () => {
    const statusWithoutPlayers = without(STATUS, 'players');

    it('returns a body that breaks its generated schema unless constructed to validate', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(statusWithoutPlayers));
      const client = newClient();
      expect(client.getValidateResponse()).toBe(true);

      const status = await getStatus(new PipelineTransport(client));

      expect(status).toEqual(statusWithoutPlayers);
    });

    it('returns such a body when constructed with validateResponse: false', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(statusWithoutPlayers));
      const transport = new PipelineTransport(newClient(), {
        validateResponse: false,
      });

      await expect(getStatus(transport)).resolves.toEqual(statusWithoutPlayers);
    });

    it('rejects such a body with EsiValidationError naming the URL when constructed with validateResponse: true, and evicts it from the cache', async () => {
      fetchMock.mockResponses(
        [JSON.stringify(statusWithoutPlayers), { headers: { etag: '"a"' } }],
        [JSON.stringify(STATUS), { headers: { etag: '"b"' } }],
      );
      const client = newClient();
      client.setCache(new ETagCacheManager({ cleanupInterval: 0 }));
      const transport = new PipelineTransport(client, {
        validateResponse: true,
      });

      const failure = getStatus(transport);
      await expect(failure).rejects.toBeInstanceOf(EsiValidationError);
      await expect(failure).rejects.toMatchObject({
        direction: 'response',
        message: expect.stringContaining('https://esi.evetech.net/status'),
      });

      await expect(getStatus(transport)).resolves.toEqual(STATUS);
      expect(fetchMock.mock.calls).toHaveLength(2);
      expect(sent(1).headers.get('if-none-match')).toBeNull();
    });

    it('validates each page only when constructed with validateResponse: true', async () => {
      const orderWithoutPrice = without(marketOrder(1), 'price');
      const page = JSON.stringify([orderWithoutPrice]);
      const query = { region_id: 10000002, order_type: 'sell' as const };

      fetchMock.mockResponseOnce(page);
      const unvalidated: unknown[] = [];
      for await (const order of getMarketsRegionIdOrders(
        new PipelineTransport(newClient()),
        query,
      )) {
        unvalidated.push(order);
      }
      expect(unvalidated).toEqual([orderWithoutPrice]);

      fetchMock.mockResponseOnce(page);
      const validated = getMarketsRegionIdOrders(
        new PipelineTransport(newClient(), { validateResponse: true }),
        query,
      )[Symbol.asyncIterator]();
      await expect(validated.next()).rejects.toBeInstanceOf(EsiValidationError);
    });
  });

  describe('paginate', () => {
    it('follows X-Pages and yields every item in order', async () => {
      fetchMock.mockResponses(
        [
          JSON.stringify([marketOrder(1), marketOrder(2)]),
          { headers: { 'x-pages': '2' } },
        ],
        [JSON.stringify([marketOrder(3)]), { headers: { 'x-pages': '2' } }],
      );
      const transport = new PipelineTransport(newClient());

      const ids: number[] = [];
      for await (const order of getMarketsRegionIdOrders(transport, {
        region_id: 10000002,
        order_type: 'sell',
      })) {
        ids.push(order.order_id);
      }

      expect(ids).toEqual([1, 2, 3]);
      expect(sent(0).url.pathname).toBe('/markets/10000002/orders');
      expect(sent(0).url.searchParams.get('order_type')).toBe('sell');
      expect(sent(1).url.searchParams.get('page')).toBe('2');
    });
  });
});
