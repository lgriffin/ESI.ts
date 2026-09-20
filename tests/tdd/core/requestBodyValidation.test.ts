import { z } from 'zod';
import { ApiClient } from '../../../src/core/ApiClient';
import { createClient } from '../../../src/core/endpoints/createClient';
import { EndpointMap } from '../../../src/core/endpoints/EndpointDefinition';
import { EsiValidationError } from '../../../src/core/util/error';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

describe('request body validation', () => {
  let apiClient: ApiClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    apiClient = new ApiClient('test', BASE_URL);
    apiClient.setRateLimiter(rateLimiter);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  const endpointsWithRequestSchema = {
    postNames: {
      path: 'universe/ids',
      method: 'POST' as const,
      requiresAuth: false,
      bodyBuilder: (names: string[]) => names,
      requestSchema: z.array(z.string().min(1)),
    },
    postIds: {
      path: 'universe/names',
      method: 'POST' as const,
      requiresAuth: false,
      bodyBuilder: (ids: number[]) => ids,
      requestSchema: z.array(z.number().int()),
    },
    postWithBody: {
      path: 'test/body',
      method: 'POST' as const,
      requiresAuth: false,
      hasBody: true,
      requestSchema: z.looseObject({
        name: z.string(),
        count: z.number(),
      }),
    },
  } satisfies EndpointMap;

  const endpointsWithoutRequestSchema = {
    postNoSchema: {
      path: 'test/no-schema',
      method: 'POST' as const,
      requiresAuth: false,
      hasBody: true,
    },
  } satisfies EndpointMap;

  const getOnlyEndpoints = {
    getStatus: {
      path: 'latest/status/',
      method: 'GET' as const,
      requiresAuth: false,
    },
  } satisfies EndpointMap;

  describe('when validateRequest is true', () => {
    beforeEach(() => {
      apiClient.setValidateRequest(true);
    });

    it('should reject invalid body for bodyBuilder endpoint', async () => {
      const client = createClient(apiClient, endpointsWithRequestSchema);

      // Pass numbers instead of strings
      await expect(
        (client.postNames as (...args: unknown[]) => Promise<unknown>)([
          123, 456,
        ]),
      ).rejects.toThrow(EsiValidationError);
    });

    it('should reject invalid body for hasBody endpoint', async () => {
      const client = createClient(apiClient, endpointsWithRequestSchema);

      // Pass object missing required fields
      await expect(
        (client.postWithBody as (...args: unknown[]) => Promise<unknown>)({
          name: 'test',
          // missing count
        }),
      ).rejects.toThrow(EsiValidationError);
    });

    it('should pass through valid body for bodyBuilder endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ characters: [] }));
      const client = createClient(apiClient, endpointsWithRequestSchema);

      await expect(
        (client.postNames as (...args: unknown[]) => Promise<unknown>)([
          'Tritanium',
          'Pyerite',
        ]),
      ).resolves.toBeDefined();
    });

    it('should pass through valid body for hasBody endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));
      const client = createClient(apiClient, endpointsWithRequestSchema);

      await expect(
        (client.postWithBody as (...args: unknown[]) => Promise<unknown>)({
          name: 'test',
          count: 5,
        }),
      ).resolves.toBeDefined();
    });

    it('should skip validation for endpoints without requestSchema', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));
      const client = createClient(apiClient, endpointsWithoutRequestSchema);

      // Any body should pass since no requestSchema is defined
      await expect(
        (client.postNoSchema as (...args: unknown[]) => Promise<unknown>)({
          anything: 'goes',
        }),
      ).resolves.toBeDefined();
    });

    it('should skip validation for GET endpoints', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ players: 100 }));
      const client = createClient(apiClient, getOnlyEndpoints);

      await expect(client.getStatus()).resolves.toBeDefined();
    });

    it('should include direction "request" in the validation error', async () => {
      const client = createClient(apiClient, endpointsWithRequestSchema);

      try {
        await (client.postNames as (...args: unknown[]) => Promise<unknown>)([
          123,
        ]);
        fail('Expected EsiValidationError to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(EsiValidationError);
        const validationError = err as EsiValidationError;
        expect(validationError.direction).toBe('request');
        expect(validationError.message).toContain('Request body');
      }
    });

    it('should include the endpoint URL in the error', async () => {
      const client = createClient(apiClient, endpointsWithRequestSchema);

      try {
        await (client.postNames as (...args: unknown[]) => Promise<unknown>)([
          123,
        ]);
        fail('Expected EsiValidationError to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(EsiValidationError);
        const validationError = err as EsiValidationError;
        expect(validationError.message).toContain('universe/ids');
      }
    });

    it('should validate integer constraint on number arrays', async () => {
      const client = createClient(apiClient, endpointsWithRequestSchema);

      // Pass floating point numbers instead of integers
      await expect(
        (client.postIds as (...args: unknown[]) => Promise<unknown>)([
          1.5, 2.7,
        ]),
      ).rejects.toThrow(EsiValidationError);
    });

    it('should accept valid integer arrays', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify([{ id: 1, name: 'Test', category: 'character' }]),
      );
      const client = createClient(apiClient, endpointsWithRequestSchema);

      await expect(
        (client.postIds as (...args: unknown[]) => Promise<unknown>)([1, 2, 3]),
      ).resolves.toBeDefined();
    });

    it('should allow extra fields with looseObject schemas', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));
      const client = createClient(apiClient, endpointsWithRequestSchema);

      // looseObject should permit extra fields
      await expect(
        (client.postWithBody as (...args: unknown[]) => Promise<unknown>)({
          name: 'test',
          count: 5,
          extraField: 'allowed',
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('when validateRequest is false (default)', () => {
    it('should default to false', () => {
      expect(apiClient.getValidateRequest()).toBe(false);
    });

    it('should skip validation even with invalid body', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ characters: [] }));
      const client = createClient(apiClient, endpointsWithRequestSchema);

      // Invalid body (numbers instead of strings) should pass without validation
      await expect(
        (client.postNames as (...args: unknown[]) => Promise<unknown>)([
          123, 456,
        ]),
      ).resolves.toBeDefined();
    });

    it('should skip validation for hasBody endpoints', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));
      const client = createClient(apiClient, endpointsWithRequestSchema);

      // Missing required field should pass without validation
      await expect(
        (client.postWithBody as (...args: unknown[]) => Promise<unknown>)({
          name: 'test',
          // missing count
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('validateRequest getter/setter', () => {
    it('should set and get validateRequest', () => {
      apiClient.setValidateRequest(true);
      expect(apiClient.getValidateRequest()).toBe(true);

      apiClient.setValidateRequest(false);
      expect(apiClient.getValidateRequest()).toBe(false);
    });

    it('should include validateRequest in toJSON', () => {
      apiClient.setValidateRequest(true);
      const json = apiClient.toJSON();
      expect(json.validateRequest).toBe(true);
    });
  });
});
