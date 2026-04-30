import { ApiClientBuilder } from '../../core/ApiClientBuilder';
import { RateLimiter } from '../../core/rateLimiter/RateLimiter';
import { getConfig } from '../../config/configManager';
import fetchMock from 'jest-fetch-mock';
import { getBody, getHeaders } from '../../../src/core/util/testHelpers';
import '../../../types/global.d.ts';

fetchMock.enableMocks();

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
global.getHeaders = getHeaders;
