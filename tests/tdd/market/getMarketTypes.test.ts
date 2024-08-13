import { getMarketTypes } from '../../../src/api/market/getMarketTypes';
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

const marketTypesApi = new getMarketTypes(client);

describe('GetMarketTypesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return market types', async () => {
        const mockResponse = [34, 35, 36];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => marketTypesApi.getMarketTypes(10000002));

        expect(Array.isArray(result)).toBe(true);
        (result as number[]).forEach(typeId => {
            expect(typeof typeId).toBe('number');
        });
    });
});
