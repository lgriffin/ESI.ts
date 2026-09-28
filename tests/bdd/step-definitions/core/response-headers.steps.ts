import { defineFeature, loadFeature } from 'jest-cucumber';
import { StatusClient } from '../../../../src/clients/StatusClient';
import { ApiClient } from '../../../../src/core/ApiClient';
import { EsiError } from '../../../../src/core/util/error';
import { RateLimiter } from '../../../../src/core/rateLimiter/RateLimiter';
import { EsiClient } from '../../../../src/EsiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const feature = loadFeature(
  'tests/bdd/features/core/0052-response-headers.feature',
);

const STATUS_BODY = JSON.stringify({
  players: 30000,
  server_version: '2148422',
  start_time: '2026-04-29T11:00:00Z',
  vip: false,
});

/** GET markets/{region_id}/types is paginated by X-Pages; each page is a list of type ids. */
const THE_FORGE = 10000002;

function paginationClient(): EsiClient {
  return new EsiClient({
    clientId: 'bdd-response-headers',
    baseUrl: 'https://esi.evetech.net',
    retryConfig: { maxRetries: 0 },
    rateLimiterConfig: { minDelayMs: 0 },
    logLevel: 'error',
  });
}

/** The page a request URL asked for: its page query parameter, or 1 without one. */
function pageOf(url: string): number {
  return Number(new URL(url).searchParams.get('page') ?? '1');
}

/** Serves page n of the market types as [n], announcing xPages(n) pages. */
function serveMarketTypePages(xPages: (page: number) => number): void {
  fetchMock.mockResponse(async (request) => {
    const page = pageOf(request.url);
    return {
      body: JSON.stringify([page]),
      headers: {
        'content-type': 'application/json',
        'x-pages': String(xPages(page)),
      },
    };
  });
}

function requestedPages(): number[] {
  return fetchMock.mock.calls.map(([input]) =>
    pageOf(input instanceof Request ? input.url : String(input)),
  );
}

defineFeature(feature, (test) => {
  let apiClient: ApiClient;
  let statusClient: StatusClient;
  let result: any;
  let error: EsiError;

  beforeEach(() => {
    fetchMock.resetMocks();
    const rateLimiter = new RateLimiter();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    apiClient = new ApiClient('https://esi.evetech.net', 'test-client');
    apiClient.setRateLimiter(rateLimiter);
    statusClient = new StatusClient(apiClient);
  });

  test('Deprecation notice arrives as warning code 299', ({
    given,
    when,
    then,
  }) => {
    given('a deprecated endpoint that returns a 299 warning header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          warning: '299 - "This route is deprecated"',
        },
      });
    });

    when('the client calls it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta shall contain the deprecation warning with code 299', () => {
      expect(result.meta.warning).toBeDefined();
      expect(result.meta.warning!.code).toBe(299);
      expect(result.meta.warning!.message).toBe('This route is deprecated');
    });
  });

  test('Upgrade notice arrives as warning code 199', ({
    given,
    when,
    then,
  }) => {
    given('an endpoint that returns a 199 upgrade warning header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          warning: '199 - "This route has an upgrade available"',
        },
      });
    });

    when('the client calls it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta shall contain the upgrade warning with code 199', () => {
      expect(result.meta.warning).toBeDefined();
      expect(result.meta.warning!.code).toBe(199);
      expect(result.meta.warning!.message).toBe(
        'This route has an upgrade available',
      );
    });
  });

  test('Response without a Warning header leaves meta.warning undefined', ({
    given,
    when,
    then,
  }) => {
    given('a normal endpoint with no warning header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: { 'content-type': 'application/json' },
      });
    });

    when('the client calls it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta shall not contain a warning', () => {
      expect(result.meta.warning).toBeUndefined();
    });
  });

  test('Request identifier header is exposed as meta.requestId', ({
    given,
    when,
    then,
  }) => {
    given('an API response with x-esi-request-id header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          'x-esi-request-id': 'abc-123-def-456',
        },
      });
    });

    when('the client calls it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta shall contain the request ID', () => {
      expect(result.meta.requestId).toBe('abc-123-def-456');
    });
  });

  test('EsiError retains the request ID, status code, and URL given at construction', ({
    given,
    then,
  }) => {
    given('an EsiError created with a request ID', () => {
      error = new EsiError(
        404,
        'Resource not found',
        'https://esi.evetech.net/latest/characters/12345/',
        'abc-123-def-456',
      );
    });

    then(
      'the EsiError shall contain the request ID and status code and url',
      () => {
        expect(error.requestId).toBe('abc-123-def-456');
        expect(error.statusCode).toBe(404);
        expect(error.url).toBe(
          'https://esi.evetech.net/latest/characters/12345/',
        );
      },
    );
  });

  test('Date header is exposed as meta.date', ({ given, when, then }) => {
    given('an API response with a Date header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          date: 'Tue, 29 Apr 2026 12:00:00 GMT',
        },
      });
    });

    when('the client calls it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta shall contain the date', () => {
      expect(result.meta.date).toBe('Tue, 29 Apr 2026 12:00:00 GMT');
    });
  });

  test('Content-Language header is exposed as meta.contentLanguage', ({
    given,
    when,
    then,
  }) => {
    given('an API response with a Content-Language header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          'content-language': 'en-us',
        },
      });
    });

    when('the client calls it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta shall contain the language', () => {
      expect(result.meta.contentLanguage).toBe('en-us');
    });
  });
  test('A server status served as text/plain resolves with its fields', ({
    given,
    when,
    then,
  }) => {
    given('an API response whose JSON body is labelled text/plain', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    });

    when('the client calls it with metadata', async () => {
      result = await statusClient.withMetadata().getStatus();
    });

    then('the meta shall carry the server status from the body', () => {
      expect(result.data).toEqual(JSON.parse(STATUS_BODY));
      expect(fetchMock.mock.calls).toHaveLength(1);
    });
  });

  test('Page 2 announcing a third page is the last page requested', ({
    given,
    when,
    then,
    and,
  }) => {
    let client: EsiClient;

    given(
      'ESI answers the market types with page 1 announcing 2 pages and page 2 announcing 3',
      () => {
        client = paginationClient();
        serveMarketTypePages((page) => (page === 1 ? 2 : 3));
      },
    );

    when('the client requests the market types for The Forge', async () => {
      result = await client.market.getMarketTypes(THE_FORGE);
    });

    then('the client resolves with the market types of pages 1 and 2', () => {
      expect(result).toEqual([1, 2]);
    });

    and(/^the client requested (\d+) pages$/, (count: string) => {
      expect(requestedPages()).toEqual(
        Array.from({ length: Number(count) }, (_, i) => i + 1),
      );
      client.shutdown();
    });
  });

  test('X-Pages of 1001 is walked as far as page 1000', ({
    given,
    when,
    then,
    and,
  }) => {
    let client: EsiClient;

    given(
      'ESI answers the market types with page 1 announcing 1001 pages and a type on every page',
      () => {
        client = paginationClient();
        serveMarketTypePages(() => 1001);
      },
    );

    when('the client requests the market types for The Forge', async () => {
      result = await client.market.getMarketTypes(THE_FORGE);
    });

    then(/^the client resolves with (\d+) market types$/, (count: string) => {
      expect(result).toHaveLength(Number(count));
      expect(result[result.length - 1]).toBe(Number(count));
    });

    and(/^the client requested (\d+) pages$/, (count: string) => {
      expect(requestedPages()).toHaveLength(Number(count));
      expect(Math.max(...requestedPages())).toBe(Number(count));
      client.shutdown();
    });
  });
});
