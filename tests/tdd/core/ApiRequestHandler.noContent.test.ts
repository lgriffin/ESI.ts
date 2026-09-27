import { ApiClient } from '../../../src/core/ApiClient';
import { handleRequest } from '../../../src/core/ApiRequestHandler';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { logCalls, spyLogger } from '../helpers/spyLogger';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.evetech.net';

// Endpoints that opt in with emptyWhenNoContent read a 200 with
// Content-Length 0 as no content (#433).
describe('ApiRequestHandler no-content answers', () => {
  let client: ApiClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    fetchMock.resetMocks();
    rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client = new ApiClient('test', BASE_URL);
    client.setRateLimiter(rateLimiter);
  });

  afterEach(() => {
    rateLimiter.setTestMode(false);
  });

  it('should reject a 200 with Content-Length 0 unless the endpoint opts in', async () => {
    fetchMock.mockResponseOnce('', {
      status: 200,
      headers: { 'content-length': '0' },
    });

    await expect(
      handleRequest(client, 'v1/contracts/public/items/1/', 'GET'),
    ).rejects.toThrow('Invalid JSON response');
  });

  it('should resolve a 200 with Content-Length 0 as no content when the endpoint opts in', async () => {
    fetchMock.mockResponseOnce('', {
      status: 200,
      headers: { 'content-length': '0' },
    });

    const result = await handleRequest(
      client,
      'v1/contracts/public/items/2/',
      'GET',
      undefined,
      false,
      true,
      undefined,
      undefined,
      true,
    );

    expect(result.status).toBe(200);
    expect(result.body).toBeUndefined();
  });

  it('should log the no-content answer with its status when the endpoint opts in', async () => {
    const logger = spyLogger();
    client.setLogger(logger);
    fetchMock.mockResponseOnce('', {
      status: 200,
      headers: { 'content-length': '0' },
    });

    await handleRequest(
      client,
      'v1/contracts/public/items/4/',
      'GET',
      undefined,
      false,
      true,
      undefined,
      undefined,
      true,
    );

    expect(
      logCalls(logger).filter(([, message]) =>
        message.startsWith('No Content'),
      ),
    ).toEqual([
      [
        'info',
        expect.stringContaining('v1/contracts/public/items/4/'),
        { status: 200 },
      ],
    ]);
  });

  it('should keep the 204 status of a no-content answer when the endpoint opts in', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 204,
        headers: { 'content-length': '0' },
      }),
    );

    const result = await handleRequest(
      client,
      'v1/contracts/public/items/5/',
      'GET',
      undefined,
      false,
      true,
      undefined,
      undefined,
      true,
    );

    expect(result.status).toBe(204);
    expect(result.body).toBeUndefined();
  });

  it('should still reject an empty 200 without Content-Length 0 when the endpoint opts in', async () => {
    fetchMock.mockResponseOnce('', { status: 200 });

    await expect(
      handleRequest(
        client,
        'v1/contracts/public/items/3/',
        'GET',
        undefined,
        false,
        true,
        undefined,
        undefined,
        true,
      ),
    ).rejects.toThrow('Invalid JSON response');
  });
});
