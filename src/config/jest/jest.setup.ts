import fetchMock from 'jest-fetch-mock';
import { ApiClientBuilder } from '../../core/ApiClientBuilder';
import { getConfig } from '../configManager'; // Adjusted the path if needed

let client: any;

beforeAll(() => {
    const config = getConfig();

    client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined) // Allow undefined token
        .build();
});

fetchMock.enableMocks();

export const getClient = () => client;
