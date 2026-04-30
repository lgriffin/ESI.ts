import { StatusClient } from '../../../src/clients/StatusClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { EsiError } from '../../../src/core/util/error';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const STATUS_BODY = JSON.stringify({
  players: 30000,
  server_version: '2148422',
  start_time: '2026-04-29T11:00:00Z',
});

describe('BDD: ESI Response Header Best Practices', () => {
  let apiClient: ApiClient;
  let statusClient: StatusClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const rateLimiter = new RateLimiter();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    apiClient = new ApiClient('https://esi.evetech.net', 'test-client');
    apiClient.setRateLimiter(rateLimiter);
    statusClient = new StatusClient(apiClient);
  });

  describe('Feature: Warning Header Detection', () => {
    describe('Scenario: Deprecated endpoint returns 299 warning', () => {
      it('Given a deprecated endpoint, When I call it with metadata, Then the meta should contain the deprecation warning', async () => {
        fetchMock.mockResponseOnce(STATUS_BODY, {
          headers: {
            'content-type': 'application/json',
            warning: '299 - "This route is deprecated"',
          },
        });

        const metaClient = statusClient.withMetadata();
        const result = await metaClient.getStatus();

        expect(result.meta.warning).toBeDefined();
        expect(result.meta.warning!.code).toBe(299);
        expect(result.meta.warning!.message).toBe('This route is deprecated');
      });
    });

    describe('Scenario: Endpoint returns 199 upgrade notice', () => {
      it('Given an endpoint with an available upgrade, When I call it with metadata, Then the meta should contain the upgrade warning', async () => {
        fetchMock.mockResponseOnce(STATUS_BODY, {
          headers: {
            'content-type': 'application/json',
            warning: '199 - "This route has an upgrade available"',
          },
        });

        const metaClient = statusClient.withMetadata();
        const result = await metaClient.getStatus();

        expect(result.meta.warning).toBeDefined();
        expect(result.meta.warning!.code).toBe(199);
        expect(result.meta.warning!.message).toBe(
          'This route has an upgrade available',
        );
      });
    });

    describe('Scenario: Endpoint returns no warning', () => {
      it('Given a normal endpoint, When I call it with metadata, Then the meta should not contain a warning', async () => {
        fetchMock.mockResponseOnce(STATUS_BODY, {
          headers: { 'content-type': 'application/json' },
        });

        const metaClient = statusClient.withMetadata();
        const result = await metaClient.getStatus();

        expect(result.meta.warning).toBeUndefined();
      });
    });
  });

  describe('Feature: Request ID Tracking', () => {
    describe('Scenario: Request ID exposed in metadata', () => {
      it('Given an API response with x-esi-request-id, When I call with metadata, Then the meta should contain the request ID', async () => {
        fetchMock.mockResponseOnce(STATUS_BODY, {
          headers: {
            'content-type': 'application/json',
            'x-esi-request-id': 'abc-123-def-456',
          },
        });

        const metaClient = statusClient.withMetadata();
        const result = await metaClient.getStatus();

        expect(result.meta.requestId).toBe('abc-123-def-456');
      });
    });

    describe('Scenario: Request ID included in EsiError on failure', () => {
      it('Given an API error response with x-esi-request-id, When the request fails, Then the EsiError should contain the request ID', () => {
        const error = new EsiError(
          404,
          'Resource not found',
          'https://esi.evetech.net/latest/characters/12345/',
          'abc-123-def-456',
        );

        expect(error.requestId).toBe('abc-123-def-456');
        expect(error.statusCode).toBe(404);
        expect(error.url).toBe(
          'https://esi.evetech.net/latest/characters/12345/',
        );
      });
    });
  });

  describe('Feature: Date and Content-Language Exposure', () => {
    describe('Scenario: Date header exposed in metadata', () => {
      it('Given an API response with a Date header, When I call with metadata, Then the meta should contain the date', async () => {
        fetchMock.mockResponseOnce(STATUS_BODY, {
          headers: {
            'content-type': 'application/json',
            date: 'Tue, 29 Apr 2026 12:00:00 GMT',
          },
        });

        const metaClient = statusClient.withMetadata();
        const result = await metaClient.getStatus();

        expect(result.meta.date).toBe('Tue, 29 Apr 2026 12:00:00 GMT');
      });
    });

    describe('Scenario: Content-Language exposed in metadata', () => {
      it('Given an API response with Content-Language, When I call with metadata, Then the meta should contain the language', async () => {
        fetchMock.mockResponseOnce(STATUS_BODY, {
          headers: {
            'content-type': 'application/json',
            'content-language': 'en-us',
          },
        });

        const metaClient = statusClient.withMetadata();
        const result = await metaClient.getStatus();

        expect(result.meta.contentLanguage).toBe('en-us');
      });
    });
  });
});
