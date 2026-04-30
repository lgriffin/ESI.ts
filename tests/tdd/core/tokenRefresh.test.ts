import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { EsiError } from '../../../src/core/util/error';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('Token Refresh', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  describe('ApiClient.refreshToken', () => {
    it('should call the token provider and update the access token', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'old-token',
      );
      client.setTokenProvider(async () => 'new-token');

      const token = await client.refreshToken();

      expect(token).toBe('new-token');
      expect(client.getAuthorizationHeader()).toBe('Bearer new-token');
    });

    it('should throw when no token provider is configured', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net', 'token');

      await expect(client.refreshToken()).rejects.toThrow(
        'No token provider configured',
      );
    });

    it('should coalesce concurrent refresh calls', async () => {
      let callCount = 0;
      const client = new ApiClient('test', 'https://esi.evetech.net', 'old');
      client.setTokenProvider(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return `token-${callCount}`;
      });

      const [token1, token2, token3] = await Promise.all([
        client.refreshToken(),
        client.refreshToken(),
        client.refreshToken(),
      ]);

      expect(callCount).toBe(1);
      expect(token1).toBe('token-1');
      expect(token2).toBe('token-1');
      expect(token3).toBe('token-1');
    });

    it('should allow a new refresh after the previous one completes', async () => {
      let callCount = 0;
      const client = new ApiClient('test', 'https://esi.evetech.net', 'old');
      client.setTokenProvider(async () => {
        callCount++;
        return `token-${callCount}`;
      });

      const first = await client.refreshToken();
      const second = await client.refreshToken();

      expect(callCount).toBe(2);
      expect(first).toBe('token-1');
      expect(second).toBe('token-2');
    });

    it('should clear in-flight state on provider error', async () => {
      let callCount = 0;
      const client = new ApiClient('test', 'https://esi.evetech.net', 'old');
      client.setTokenProvider(async () => {
        callCount++;
        if (callCount === 1) throw new Error('SSO down');
        return 'recovered-token';
      });

      await expect(client.refreshToken()).rejects.toThrow('SSO down');

      const token = await client.refreshToken();
      expect(token).toBe('recovered-token');
      expect(callCount).toBe(2);
    });

    it('should report hasTokenProvider correctly', () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');

      expect(client.hasTokenProvider()).toBe(false);

      client.setTokenProvider(async () => 'token');
      expect(client.hasTokenProvider()).toBe(true);

      client.setTokenProvider(undefined);
      expect(client.hasTokenProvider()).toBe(false);
    });
  });

  describe('handleRequest 401 retry', () => {
    it('should retry once with a fresh token on 401', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'expired-token',
      );
      client.setRateLimiter(rateLimiter);
      client.setTokenProvider(async () => 'fresh-token');

      fetchMock
        .mockResponseOnce('', { status: 401 })
        .mockResponseOnce(JSON.stringify({ character_id: 123 }));

      const result = await handleRequest(
        client,
        'latest/characters/123/',
        'GET',
        undefined,
        true,
      );

      expect(result.body).toEqual({ character_id: 123 });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const secondCallHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(secondCallHeaders['Authorization']).toBe('Bearer fresh-token');
    });

    it('should not retry on 401 when no token provider is set', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'expired-token',
      );
      client.setRateLimiter(rateLimiter);

      fetchMock.mockResponseOnce('', { status: 401 });

      await expect(
        handleRequest(client, 'latest/characters/123/', 'GET', undefined, true),
      ).rejects.toThrow(EsiError);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 for non-authenticated requests', async () => {
      const client = new ApiClient('test', 'https://esi.evetech.net');
      client.setRateLimiter(rateLimiter);
      client.setTokenProvider(async () => 'fresh-token');

      fetchMock.mockResponseOnce('', { status: 401 });

      await expect(
        handleRequest(client, 'latest/status/', 'GET', undefined, false),
      ).rejects.toThrow(EsiError);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should throw TOKEN_REFRESH_FAILED when the provider errors', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'expired-token',
      );
      client.setRateLimiter(rateLimiter);
      client.setTokenProvider(async () => {
        throw new Error('Refresh token expired');
      });

      fetchMock.mockResponseOnce('', { status: 401 });

      await expect(
        handleRequest(client, 'latest/characters/123/', 'GET', undefined, true),
      ).rejects.toThrow('Token refresh failed: Refresh token expired');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not retry more than once on repeated 401', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'bad-token',
      );
      client.setRateLimiter(rateLimiter);
      client.setTokenProvider(async () => 'still-bad-token');

      fetchMock
        .mockResponseOnce('', { status: 401 })
        .mockResponseOnce('', { status: 401 });

      await expect(
        handleRequest(client, 'latest/characters/123/', 'GET', undefined, true),
      ).rejects.toThrow(EsiError);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should not retry on other 4xx errors', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'valid-token',
      );
      client.setRateLimiter(rateLimiter);
      client.setTokenProvider(async () => 'fresh-token');

      fetchMock.mockResponseOnce('', { status: 403 });

      await expect(
        handleRequest(client, 'latest/characters/123/', 'GET', undefined, true),
      ).rejects.toThrow(EsiError);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should pass through the retry EsiError on second 401', async () => {
      const client = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'bad-token',
      );
      client.setRateLimiter(rateLimiter);
      client.setTokenProvider(async () => 'still-bad');

      fetchMock
        .mockResponseOnce('', { status: 401 })
        .mockResponseOnce('', { status: 401 });

      try {
        await handleRequest(
          client,
          'latest/characters/123/',
          'GET',
          undefined,
          true,
        );
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EsiError);
        expect((error as EsiError).statusCode).toBe(401);
      }
    });
  });
});
