import { GetCorporationInfoApi } from '../../../src/api/corporations/getCorporationInfo';
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

const corporationInfoApi = new GetCorporationInfoApi(client);

describe('GetCorporationInfoApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation information', async () => {
        const mockResponse = {
            corporation_id: 12345,
            name: 'Test Corporation',
            ticker: 'TST',
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationInfoApi.getCorporationInfo(12345);

        expect(result).toHaveProperty('corporation_id');
        expect(typeof result.corporation_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('ticker');
        expect(typeof result.ticker).toBe('string');
    });
});
