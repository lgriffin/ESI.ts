import { GetCharacterAssetsApi } from '../../../src/api/assets/getCharacterAssets';
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

const characterAssetsApi = new GetCharacterAssetsApi(client);

describe('GetCharacterAssetsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character assets', async () => {
        const mockResponse = [
            {
                is_singleton: false,
                item_id: 1000000016835,
                location_flag: 'Hangar',
                location_id: 60014719,
                location_type: 'station',
                quantity: 1,
                type_id: 587
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await characterAssetsApi.getCharacterAssets(123456);

        expect(Array.isArray(result)).toBe(true);
        result.forEach(asset => {
            expect(asset).toHaveProperty('is_singleton');
            expect(asset).toHaveProperty('item_id');
            expect(asset).toHaveProperty('location_flag');
            expect(asset).toHaveProperty('location_id');
            expect(asset).toHaveProperty('location_type');
            expect(asset).toHaveProperty('quantity');
            expect(asset).toHaveProperty('type_id');
        });
    });
});
