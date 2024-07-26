import { GetCharacterOnlineApi } from '../../../src/api/location/getCharacterOnline';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const characterOnlineApi = new GetCharacterOnlineApi(client);

describe('GetCharacterOnlineApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character online', async () => {
        const mockResponse = {
            online: true,
            last_login: '2017-01-02T03:04:05Z',
            last_logout: '2017-01-02T03:04:05Z',
            logins: 9001
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await characterOnlineApi.getCharacterOnline(123456);

        expect(result).toHaveProperty('online');
        expect(typeof result.online).toBe('boolean');
        expect(result).toHaveProperty('last_login');
        expect(typeof result.last_login).toBe('string');
        expect(result).toHaveProperty('last_logout');
        expect(typeof result.last_logout).toBe('string');
        expect(result).toHaveProperty('logins');
        expect(typeof result.logins).toBe('number');
    });
});
