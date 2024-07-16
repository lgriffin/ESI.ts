import { PostCorporationAssetLocationsApi } from '../../../src/api/assets/postCorporationAssetLocations';
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

const corporationAssetLocationsApi = new PostCorporationAssetLocationsApi(client);

describe('PostCorporationAssetLocationsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation asset locations', async () => {
        const mockResponse = [
            {
                item_id: 1234567890,
                position: {
                    x: 1.2,
                    y: 2.3,
                    z: 3.4
                }
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationAssetLocationsApi.postCorporationAssetLocations(123456, [1234567890]);

        expect(Array.isArray(result)).toBe(true);
        result.forEach(location => {
            expect(location).toHaveProperty('item_id');
            expect(location).toHaveProperty('position');
            expect(location.position).toHaveProperty('x');
            expect(location.position).toHaveProperty('y');
            expect(location.position).toHaveProperty('z');
        });
    });
});
