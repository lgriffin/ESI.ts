import { UniverseSchematicByIdApi } from '../../../src/api/universe/getSchematicById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseSchematicByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeSchematicByIdApi = new UniverseSchematicByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getSchematicById', async () => {
        const mockResponse = {
            schematic_id: 1,
            name: 'Test Schematic',
            description: 'A test schematic description',
            cycle_time: 300,
            materials: [
                {
                    type_id: 34,
                    quantity: 1
                }
            ],
            products: [
                {
                    type_id: 35,
                    quantity: 1
                }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type SchematicResponse = {
            schematic_id: number;
            name: string;
            description: string;
            cycle_time: number;
            materials: Array<{
                type_id: number;
                quantity: number;
            }>;
            products: Array<{
                type_id: number;
                quantity: number;
            }>;
        };

        const result = await universeSchematicByIdApi.getSchematicById(1) as SchematicResponse;

        expect(result).toHaveProperty('schematic_id');
        expect(typeof result.schematic_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
        expect(result).toHaveProperty('cycle_time');
        expect(typeof result.cycle_time).toBe('number');
        expect(result).toHaveProperty('materials');
        expect(Array.isArray(result.materials)).toBe(true);
        expect(result).toHaveProperty('products');
        expect(Array.isArray(result.products)).toBe(true);
    });
});
