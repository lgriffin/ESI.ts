import fetchMock from 'jest-fetch-mock';
import { PipelineTransport } from '../../../src/adapters/PipelineTransport';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { EsiError } from '../../../src/core/util/error';
import type { OperationMeta } from '../../../src/core/ports/OperationTransport';
import {
  getMarketsRegionIdOrders,
  getStatus,
} from '../../../src/generated/operations.generated';

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
      fetchMock.mockResponseOnce(
        JSON.stringify({ players: 1, server_version: '1', start_time: 'x' }),
      );

      const status = await getStatus(new PipelineTransport(newClient()));

      expect(status.players).toBe(1);
      expect(sent().url.pathname).toBe('/status');
    });
  });

  describe('paginate', () => {
    it('follows X-Pages and yields every item in order', async () => {
      fetchMock.mockResponses(
        [
          JSON.stringify([{ order_id: 1 }, { order_id: 2 }]),
          { headers: { 'x-pages': '2' } },
        ],
        [JSON.stringify([{ order_id: 3 }]), { headers: { 'x-pages': '2' } }],
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
