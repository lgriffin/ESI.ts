import { PostCharacterAssetNamesApi } from '../../../src/api/assets/postCharacterAssetNames';
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

const postCharacterAssetNamesApi = new PostCharacterAssetNamesApi(client);

describe('PostCharacterAssetNamesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character asset names', async () => {
        const mockResponse = [
            {
                item_id: 12345,
                name: 'Asset Name'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => postCharacterAssetNamesApi.postCharacterAssetNames(123456789, [1, 2, 3]));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((assetName: { item_id: number; name: string }) => {
            expect(assetName).toHaveProperty('item_id');
            expect(typeof assetName.item_id).toBe('number');
            expect(assetName).toHaveProperty('name');
            expect(typeof assetName.name).toBe('string');
        });
    });
});
