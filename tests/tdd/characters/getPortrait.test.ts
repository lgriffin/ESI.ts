import { GetPortraitApi } from '../../../src/api/characters/getPortrait';
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

const portraitApi = new GetPortraitApi(client);

describe('GetPortraitApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for portrait', async () => {
        const mockResponse = {
            px64x64: 'https://imageserver.eveonline.com/Character/123456_64.jpg',
            px128x128: 'https://imageserver.eveonline.com/Character/123456_128.jpg'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => portraitApi.getPortrait(123456));

        expect(result).toHaveProperty('px64x64');
        expect(result).toHaveProperty('px128x128');
    });
});
