import { GetNpcCorporationsApi } from '../../../src/api/corporations/getNpcCorporations';
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

const api = new GetNpcCorporationsApi(client);

describe('GetNpcCorporationsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for NPC corporations', async () => {
        const mockResponse = [1000169, 1000170, 1000171];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => api.getNpcCorporations());

        expect(Array.isArray(result)).toBe(true);
        (result as number[]).forEach(corpId => {
            expect(typeof corpId).toBe('number');
        });
    });
});
