import { GetCorporationAssetsApi } from '../../../src/api/assets/getCorporationAssets';
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

const getCorporationAssetsApi = new GetCorporationAssetsApi(client);

describe('GetCorporationAssetsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation assets', async () => {
        const mockResponse = [
            {
                item_id: 12345,
                location_flag: 'Hangar',
                location_id: 54321,
                location_type: 'station',
                quantity: 100,
                type_id: 6789
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => getCorporationAssetsApi.getCorporationAssets(123456789));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((asset: { item_id: number; location_flag: string; location_id: number; location_type: string; quantity: number; type_id: number }) => {
            expect(asset).toHaveProperty('item_id');
            expect(typeof asset.item_id).toBe('number');
            expect(asset).toHaveProperty('location_flag');
            expect(typeof asset.location_flag).toBe('string');
            expect(asset).toHaveProperty('location_id');
            expect(typeof asset.location_id).toBe('number');
            expect(asset).toHaveProperty('location_type');
            expect(typeof asset.location_type).toBe('string');
            expect(asset).toHaveProperty('quantity');
            expect(typeof asset.quantity).toBe('number');
            expect(asset).toHaveProperty('type_id');
            expect(typeof asset.type_id).toBe('number');
        });
    });
});
