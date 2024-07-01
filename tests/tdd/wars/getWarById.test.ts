import { WarByIdApi } from '../../../src/api/wars/getWarById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('WarByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const warByIdApi = new WarByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getWarById', async () => {
        const mockResponse = { war_id: 1, declared: '2023-01-01', finished: '2023-01-10' };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await warByIdApi.getWarById(1);
        expect(result).toHaveProperty('war_id');
        expect(result).toHaveProperty('declared');
        expect(result).toHaveProperty('finished');
    });
});
