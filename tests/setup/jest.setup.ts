import { ApiClientBuilder } from '../../src/core/ApiClientBuilder';
import { RateLimiter } from '../../src/core/rateLimiter/RateLimiter';
import { getConfig } from '../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';
import { getBody } from '../../src/core/util/testHelpers';
import '../types/global.d.ts';

fetchMock.enableMocks();

// The library's default logger is silent under test, so a failing test's
// output is not buried under the warnings the error-path tests provoke on
// purpose (circuit opened, 429, an unparsable body). A test that asserts on
// log lines supplies its own logger or sets ESI_LOG_LEVEL itself; run with
// ESI_LOG_LEVEL=warn npm test to see the library's lines again.
process.env.ESI_LOG_LEVEL ??= 'silent';

const config = getConfig();

const rateLimiter = new RateLimiter();
rateLimiter.setTestMode(true);

const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .setRateLimiter(rateLimiter)
  .build();

export const getClient = () => client;

beforeEach(() => {
  fetchMock.resetMocks();
  rateLimiter.reset();
});

global.getBody = getBody;
