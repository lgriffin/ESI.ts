import { GetCorporationIconApi } from '../../../src/api/corporations/getCorporationIcon';
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

const corporationIconApi = new GetCorporationIconApi(client);

describe('GetCorporationIconApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation icon', async () => {
        const mockResponse = {
            px64x64: 'https://images.evetech.net/corporations/12345/logo?size=64x64',
            px128x128: 'https://images.evetech.net/corporations/12345/logo?size=128x128',
            px256x256: 'https://images.evetech.net/corporations/12345/logo?size=256x256',
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationIconApi.getCorporationIcon(12345));

        expect(result).toHaveProperty('px64x64');
        expect(typeof result.px64x64).toBe('string');
        expect(result).toHaveProperty('px128x128');
        expect(typeof result.px128x128).toBe('string');
        expect(result).toHaveProperty('px256x256');
        expect(typeof result.px256x256).toBe('string');
    });
});
