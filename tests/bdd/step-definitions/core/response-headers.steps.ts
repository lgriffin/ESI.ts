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

  test('Deprecated endpoint returns 299 warning', ({ given, when, then }) => {
    given('a deprecated endpoint that returns a 299 warning header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          warning: '299 - "This route is deprecated"',
        },
      });
    });

    when('I call it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then(
      'the meta should contain the deprecation warning with code 299',
      () => {
        expect(result.meta.warning).toBeDefined();
        expect(result.meta.warning!.code).toBe(299);
        expect(result.meta.warning!.message).toBe('This route is deprecated');
      },
    );
  });

  test('Endpoint returns 199 upgrade notice', ({ given, when, then }) => {
    given('an endpoint that returns a 199 upgrade warning header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          warning: '199 - "This route has an upgrade available"',
        },
      });
    });

    when('I call it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta should contain the upgrade warning with code 199', () => {
      expect(result.meta.warning).toBeDefined();
      expect(result.meta.warning!.code).toBe(199);
      expect(result.meta.warning!.message).toBe(
        'This route has an upgrade available',
      );
    });
  });

  test('Endpoint returns no warning', ({ given, when, then }) => {
    given('a normal endpoint with no warning header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: { 'content-type': 'application/json' },
      });
    });

    when('I call it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta should not contain a warning', () => {
      expect(result.meta.warning).toBeUndefined();
    });
  });

  test('Request ID exposed in metadata', ({ given, when, then }) => {
    given('an API response with x-esi-request-id header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          'x-esi-request-id': 'abc-123-def-456',
        },
      });
    });

    when('I call it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta should contain the request ID', () => {
      expect(result.meta.requestId).toBe('abc-123-def-456');
    });
  });

  test('Request ID included in EsiError on failure', ({ given, then }) => {
    given('an EsiError created with a request ID', () => {
      error = new EsiError(
        404,
        'Resource not found',
        'https://esi.evetech.net/latest/characters/12345/',
        'abc-123-def-456',
      );
    });

    then(
      'the EsiError should contain the request ID and status code and url',
      () => {
        expect(error.requestId).toBe('abc-123-def-456');
        expect(error.statusCode).toBe(404);
        expect(error.url).toBe(
          'https://esi.evetech.net/latest/characters/12345/',
        );
      },
    );
  });

  test('Date header exposed in metadata', ({ given, when, then }) => {
    given('an API response with a Date header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          date: 'Tue, 29 Apr 2026 12:00:00 GMT',
        },
      });
    });

    when('I call it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta should contain the date', () => {
      expect(result.meta.date).toBe('Tue, 29 Apr 2026 12:00:00 GMT');
    });
  });

  test('Content-Language exposed in metadata', ({ given, when, then }) => {
    given('an API response with a Content-Language header', () => {
      fetchMock.mockResponseOnce(STATUS_BODY, {
        headers: {
          'content-type': 'application/json',
          'content-language': 'en-us',
        },
      });
    });

    when('I call it with metadata', async () => {
      const metaClient = statusClient.withMetadata();
      result = await metaClient.getStatus();
    });

    then('the meta should contain the language', () => {
      expect(result.meta.contentLanguage).toBe('en-us');
    });
  });
});
