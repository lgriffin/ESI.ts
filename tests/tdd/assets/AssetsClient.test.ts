import { AssetsClient } from '../../../src/clients/AssetsClient';
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

const assetsClient = new AssetsClient(client);

describe('AssetsClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character assets', async () => {
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

        const result = await getBody(() => assetsClient.getCharacterAssets(123456789));

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

    it('should return valid structure for character asset locations', async () => {
        const mockResponse = [
            {
                item_id: 12345,
                position: {
                    x: 1.0,
                    y: 2.0,
                    z: 3.0
                }
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => assetsClient.postCharacterAssetLocations(123456789, [1, 2, 3]));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((location: { item_id: number; position: { x: number; y: number; z: number } }) => {
            expect(location).toHaveProperty('item_id');
            expect(typeof location.item_id).toBe('number');
            expect(location).toHaveProperty('position');
            expect(typeof location.position).toBe('object');
            expect(location.position).toHaveProperty('x');
            expect(typeof location.position.x).toBe('number');
            expect(location.position).toHaveProperty('y');
            expect(typeof location.position.y).toBe('number');
            expect(location.position).toHaveProperty('z');
            expect(typeof location.position.z).toBe('number');
        });
    });

    it('should return valid structure for character asset names', async () => {
        const mockResponse = [
            {
                item_id: 12345,
                name: 'Asset Name'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => assetsClient.postCharacterAssetNames(123456789, [1, 2, 3]));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((assetName: { item_id: number; name: string }) => {
            expect(assetName).toHaveProperty('item_id');
            expect(typeof assetName.item_id).toBe('number');
            expect(assetName).toHaveProperty('name');
            expect(typeof assetName.name).toBe('string');
        });
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

        const result = await getBody(() => assetsClient.getCorporationAssets(987654321));

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

    it('should return valid structure for corporation asset locations', async () => {
        const mockResponse = [
            {
                item_id: 12345,
                position: {
                    x: 1.0,
                    y: 2.0,
                    z: 3.0
                }
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => assetsClient.postCorporationAssetLocations(987654321, [1, 2, 3]));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((location: { item_id: number; position: { x: number; y: number; z: number } }) => {
            expect(location).toHaveProperty('item_id');
            expect(typeof location.item_id).toBe('number');
            expect(location).toHaveProperty('position');
            expect(typeof location.position).toBe('object');
            expect(location.position).toHaveProperty('x');
            expect(typeof location.position.x).toBe('number');
            expect(location.position).toHaveProperty('y');
            expect(typeof location.position.y).toBe('number');
            expect(location.position).toHaveProperty('z');
            expect(typeof location.position.z).toBe('number');
        });
    });

    it('should return valid structure for corporation asset names', async () => {
        const mockResponse = [
            {
                item_id: 12345,
                name: 'Asset Name'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => assetsClient.postCorporationAssetNames(987654321, [1, 2, 3]));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((assetName: { item_id: number; name: string }) => {
            expect(assetName).toHaveProperty('item_id');
            expect(typeof assetName.item_id).toBe('number');
            expect(assetName).toHaveProperty('name');
            expect(typeof assetName.name).toBe('string');
        });
    });
});
