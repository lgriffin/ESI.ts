import fetchMock from 'jest-fetch-mock';
import { ApiClient } from '../../../src/core/ApiClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

const ERROR_SCENARIOS = [
  { status: 500, message: 'Internal server error' },
  { status: 404, message: 'Resource not found' },
  { status: 401, message: 'Unauthorized' },
  { status: 403, message: 'Forbidden' },
  { status: 429, message: 'Too many requests' },
] as const;

/**
 * Checks that a domain client surfaces each ESI error status as an error.
 *
 * Every case builds its own ApiClient, with the default RateLimiter, and hands
 * it to `callApi`. Do not call through the suite's shared client: a 429 blocks
 * the endpoint's rate-limit group on the client that received it for 60
 * seconds, so every test that ran after it on the same client would wait past
 * Jest's timeout, and the suite would pass only in declaration order.
 */
export function describeClientErrors(
  clientName: string,
  callApi: (apiClient: ApiClient) => Promise<unknown>,
): void {
  describe(`${clientName} error handling`, () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    for (const { status, message } of ERROR_SCENARIOS) {
      it(`should throw on HTTP ${status}`, async () => {
        const config = getConfig();
        const apiClient = new ApiClientBuilder()
          .setClientId(config.projectName)
          .setLink(config.link)
          .setAccessToken('test-token')
          .build();
        fetchMock.mockResponseOnce(message, { status });

        const request = callApi(apiClient);
        await expect(request).rejects.toThrow(message);
        await expect(request).rejects.toMatchObject({ statusCode: status });
      });
    }
  });
}
