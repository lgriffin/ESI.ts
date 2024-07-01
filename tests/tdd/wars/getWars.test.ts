import { WarsApi } from '../../../src/api/wars/getWars';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('WarsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const warsApi = new WarsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getWars', async () => {
        const mockResponse = [{ war_id: 1 }, { war_id: 2 }];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await warsApi.getWars();
        expect(Array.isArray(result)).toBe(true);
        result.forEach((war: any) => {
            expect(war).toHaveProperty('war_id');
            expect(typeof war.war_id).toBe('number');
        });
    });
});
