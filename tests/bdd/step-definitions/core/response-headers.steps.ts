import { defineFeature, loadFeature } from 'jest-cucumber';
import { StatusClient } from '../../../../src/clients/StatusClient';
import { ApiClient } from '../../../../src/core/ApiClient';
import { EsiError } from '../../../../src/core/util/error';
import { RateLimiter } from '../../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const feature = loadFeature('tests/bdd/features/core/response-headers.feature');

const STATUS_BODY = JSON.stringify({
  players: 30000,
  server_version: '2148422',
  start_time: '2026-04-29T11:00:00Z',
});

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

  test('WHEN a deprecated endpoint returns a 299 warning, the client shall expose the warning', ({
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

  test('WHEN an endpoint returns a 199 upgrade notice, the client shall expose the notice', ({
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

  test('WHILE endpoint returns no warning, the client shall return an empty result', ({
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

  test('WHEN a response includes a request ID, the client shall expose it in metadata', ({
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

  test('IF requesting ID included in EsiError on failure, THEN the client shall handle it gracefully', ({
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

  test('WHEN a response includes a date header, the client shall expose it in metadata', ({
    given,
    when,
    then,
  }) => {
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

  test('WHEN a response includes a content-language header, the client shall expose it in metadata', ({
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
});
