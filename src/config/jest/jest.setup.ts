import { ApiClientBuilder } from '../../core/ApiClientBuilder';
import { getConfig } from '../../config/configManager';
import fetchMock from 'jest-fetch-mock';
import { getBody, getHeaders } from '../../../src/core/util/testHelpers';
import '../../../types/global.d.ts';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined) // Allow undefined token
    .build();

export const getClient = () => client;

beforeEach(() => {
    fetchMock.resetMocks();
    
    // Reset rate limiter before each test to ensure clean state
    const { RateLimiter } = require('../../core/rateLimiter/RateLimiter');
    const rateLimiter = RateLimiter.getInstance();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
});

// Assigning functions to the global object
global.getBody = getBody;
global.getHeaders = getHeaders;
