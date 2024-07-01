import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { WarsAPIBuilder } from '../../../src/api/wars/WarsAPIBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('WarsAPIBuilder', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    it('should build a WarsClient with valid APIs', () => {
        const warsClient = new WarsAPIBuilder(client).build();

        expect(warsClient).toHaveProperty('getWars');
        expect(warsClient).toHaveProperty('getWarById');
        expect(warsClient).toHaveProperty('getWarKillmails');
    });
});
