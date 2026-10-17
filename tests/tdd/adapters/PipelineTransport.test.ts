import fetchMock from 'jest-fetch-mock';
import { PipelineTransport } from '../../../src/adapters/PipelineTransport';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { EsiError, EsiParseError } from '../../../src/core/util/error';
import type { ILogger } from '../../../src/core/logger/ILogger';
import type { OperationMeta } from '../../../src/core/ports/OperationTransport';
import type { OperationDeprecation } from '../../../src/client';
import {
  getContractsPublicBidsContractIdMeta,
  getContractsPublicItemsContractIdMeta,
  getMarketsRegionIdOrders,
  getMetaOpenapiJson,
  getMetaOpenapiYaml,
  getMetaOpenapiYamlMeta,
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

  describe('deprecated operations', () => {
    const recording = () => {
      const logger = {
        fatal: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
      } satisfies ILogger;
      const client = newClient();
      client.setLogger(logger);
      return { logger, transport: new PipelineTransport(client) };
    };

    it('warns through the client logger with the message, replacement and sunset date', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ id: 7 }));
      const { logger, transport } = recording();

      const deprecation: OperationDeprecation = {
        message: 'Read the things list.',
        replacedBy: 'GetThings',
        sunsetDate: '2027-01-01',
      };
      const body = await transport.request(
        meta({ deprecated: true, deprecation }),
        { path: { thing_id: 7 }, query: {} },
      );

      expect(body).toEqual({ id: 7 });
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        "Operation 'Test' is deprecated. Read the things list. Use 'GetThings' instead. Sunset date: 2027-01-01.",
        { operationId: 'Test' },
      );
    });

    it('warns on the spec flag alone, and on guidance without the flag', async () => {
      fetchMock.mockResponse(JSON.stringify({}));
      const { logger, transport } = recording();
      const req = { path: { thing_id: 7 }, query: {} };

      await transport.request(meta({ deprecated: true }), req);
      await transport.request(
        meta({ deprecation: { replacedBy: 'GetThings' } }),
        req,
      );

      expect(logger.warn.mock.calls).toEqual([
        ["Operation 'Test' is deprecated.", { operationId: 'Test' }],
        [
          "Operation 'Test' is deprecated. Use 'GetThings' instead.",
          { operationId: 'Test' },
        ],
      ]);
    });

    it('warns once per paginated call, however many pages it follows', async () => {
      fetchMock.mockResponses(
        [JSON.stringify([1]), { headers: { 'x-pages': '2' } }],
        [JSON.stringify([2]), { headers: { 'x-pages': '2' } }],
      );
      const { logger, transport } = recording();

      const items: unknown[] = [];
      for await (const item of transport.paginate(
        meta({ path: '/things', pagination: 'page', deprecated: true }),
        { path: {}, query: {} },
      )) {
        items.push(item);
      }

      expect(items).toEqual([1, 2]);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('logs no warning for an operation that is not deprecated', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}));
      const { logger, transport } = recording();

      await transport.request(meta({}), { path: { thing_id: 7 }, query: {} });

      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('the OpenAPI document routes', () => {
    it('asks for the YAML document as text and returns it verbatim', async () => {
      const yaml = 'openapi: 3.1.0\ninfo:\n  title: ESI\n';
      fetchMock.mockResponseOnce(yaml, {
        headers: { 'content-type': 'application/yaml' },
      });

      const body = await getMetaOpenapiYaml(new PipelineTransport(newClient()));

      expect(body).toBe(yaml);
      expect(sent().url.pathname).toBe('/meta/openapi.yaml');
      expect(sent().headers.get('accept')).toBe(
        getMetaOpenapiYamlMeta.textResponse!.accept,
      );
    });

    it('parses the JSON document', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ openapi: '3.1.0' }));

      const body = await getMetaOpenapiJson(new PipelineTransport(newClient()));

      expect(body).toEqual({ openapi: '3.1.0' });
      expect(sent().url.pathname).toBe('/meta/openapi.json');
    });
  });

  describe('operations that answer with no content', () => {
    const emptyOk = (): void => {
      fetchMock.mockResponseOnce('', {
        status: 200,
        headers: { 'content-length': '0' },
      });
    };
    // jest-fetch-mock refuses a 204, so the Response is built by hand.
    const noContent = (): void => {
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(new Response(null, { status: 204 })),
      );
    };
    const req = { path: { thing_id: 7 }, query: {} };

    it.each([
      ['an empty 200', emptyOk],
      ['a 204', noContent],
    ])(
      'request resolves %s as [] where the meta opts in',
      async (_, answer) => {
        answer();
        const body = await new PipelineTransport(newClient()).request(
          meta({ emptyWhenNoContent: true }),
          req,
        );
        expect(body).toEqual([]);
      },
    );

    it('request still rejects an empty 200 as a parse error elsewhere', async () => {
      emptyOk();
      await expect(
        new PipelineTransport(newClient()).request(meta({}), req),
      ).rejects.toBeInstanceOf(EsiParseError);
    });

    it.each([
      ['an empty 200', emptyOk],
      ['a 204', noContent],
    ])(
      'paginate yields nothing for %s where the meta opts in',
      async (_, answer) => {
        answer();
        const items: unknown[] = [];
        for await (const item of new PipelineTransport(newClient()).paginate(
          { ...getContractsPublicBidsContractIdMeta },
          { path: { contract_id: 1 }, query: {} },
        )) {
          items.push(item);
        }
        expect(items).toEqual([]);
        expect(fetchMock.mock.calls).toHaveLength(1);
      },
    );

    it('paginate still rejects an empty 200 as a parse error elsewhere', async () => {
      emptyOk();
      const pages = new PipelineTransport(newClient()).paginate(
        { ...getContractsPublicBidsContractIdMeta, emptyWhenNoContent: false },
        { path: { contract_id: 1 }, query: {} },
      );
      await expect(pages[Symbol.asyncIterator]().next()).rejects.toBeInstanceOf(
        EsiParseError,
      );
    });

    it('is set by the generator on both public contract routes', () => {
      expect(getContractsPublicBidsContractIdMeta.emptyWhenNoContent).toBe(
        true,
      );
      expect(getContractsPublicItemsContractIdMeta.emptyWhenNoContent).toBe(
        true,
      );
    });
  });
});
