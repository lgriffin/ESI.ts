import { getMarketGroupInformation } from '../../../src/api/market/getMarketGroupInformation';
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

const marketGroupInformationApi = new getMarketGroupInformation(client);

describe('GetMarketGroupInformationApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return market group information', async () => {
        const mockResponse = {
            market_group_id: 1,
            name: 'Group 1',
            description: 'Description 1',
            types: [34, 35, 36]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketGroupInformationApi.getMarketGroupInformation(1);

        expect(result).toHaveProperty('market_group_id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(Array.isArray(result.types)).toBe(true);
        result.types.forEach((typeId: number) => {
            expect(typeof typeId).toBe('number');
        });
    });
});
