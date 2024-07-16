import { GetImplantsApi } from '../../../src/api/clones/getImplants';
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

const getImplantsApi = new GetImplantsApi(client);

describe('GetImplantsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for implants', async () => {
        const mockResponse = [1, 2, 3];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getImplantsApi.getImplants(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((implant: number) => {
            expect(typeof implant).toBe('number');
        });
    });
});
