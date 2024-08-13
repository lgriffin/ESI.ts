import { GetCharacterPublicInfoApi } from '../../../src/api/characters/getCharacterPublicInfo';
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

const characterPublicInfoApi = new GetCharacterPublicInfoApi(client);

describe('GetCharacterPublicInfoApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character public info', async () => {
        const mockResponse = {
            character_id: 123456,
            name: 'Character Name',
            corporation_id: 654321,
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterPublicInfoApi.getCharacterPublicInfo(123456));

        expect(result).toHaveProperty('character_id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('corporation_id');
    });
});
