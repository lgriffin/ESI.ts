import { GetBlueprintsApi } from '../../../src/api/characters/getBlueprints';
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

const blueprintsApi = new GetBlueprintsApi(client);

describe('GetBlueprintsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for blueprints', async () => {
        const mockResponse = [
            {
                item_id: 123456,
                type_id: 654321,
                location_id: 123456,
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => blueprintsApi.getBlueprints(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((blueprint: {item_id: number, type_id: number, location_id: number}) => {
            expect(blueprint).toHaveProperty('item_id');
            expect(blueprint).toHaveProperty('type_id');
            expect(blueprint).toHaveProperty('location_id');
        });
    });
});
