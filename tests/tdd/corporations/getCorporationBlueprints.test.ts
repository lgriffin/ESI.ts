import { GetCorporationBlueprintsApi } from '../../../src/api/corporations/getCorporationBlueprints';
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

const corporationBlueprintsApi = new GetCorporationBlueprintsApi(client);

describe('GetCorporationBlueprintsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation blueprints', async () => {
        const mockResponse = [
            {
                item_id: 12345,
                type_id: 67890,
                location_id: 54321,
                location_flag: 'CorpSAG1',
                quantity: 1,
                time_efficiency: 10,
                material_efficiency: 10,
                runs: 100,
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationBlueprintsApi.getCorporationBlueprints(12345);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(blueprint => {
            expect(blueprint).toHaveProperty('item_id');
            expect(typeof blueprint.item_id).toBe('number');
            expect(blueprint).toHaveProperty('type_id');
            expect(typeof blueprint.type_id).toBe('number');
            expect(blueprint).toHaveProperty('location_id');
            expect(typeof blueprint.location_id).toBe('number');
            expect(blueprint).toHaveProperty('location_flag');
            expect(typeof blueprint.location_flag).toBe('string');
            expect(blueprint).toHaveProperty('quantity');
            expect(typeof blueprint.quantity).toBe('number');
            expect(blueprint).toHaveProperty('time_efficiency');
            expect(typeof blueprint.time_efficiency).toBe('number');
            expect(blueprint).toHaveProperty('material_efficiency');
            expect(typeof blueprint.material_efficiency).toBe('number');
            expect(blueprint).toHaveProperty('runs');
            expect(typeof blueprint.runs).toBe('number');
        });
    });
});
