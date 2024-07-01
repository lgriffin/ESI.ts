import { UniverseStructureByIdApi } from '../../../src/api/universe/getStructureById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseStructureByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeStructureByIdApi = new UniverseStructureByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getStructureById', async () => {
        const mockResponse = {
            structure_id: 1021975535893,
            name: "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
            type_id: 35832,
            solar_system_id: 30000142,
            owner_id: 1000127,
            position: {
                x: 1.29e+12,
                y: 3.45e+10,
                z: -9.1e+11
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type StructureResponse = {
            structure_id: number;
            name: string;
            type_id: number;
            solar_system_id: number;
            owner_id: number;
            position: {
                x: number;
                y: number;
                z: number;
            };
        };

        const result = await universeStructureByIdApi.getStructureById(1021975535893) as StructureResponse;

        expect(result).toHaveProperty('structure_id');
        expect(typeof result.structure_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('type_id');
        expect(typeof result.type_id).toBe('number');
        expect(result).toHaveProperty('solar_system_id');
        expect(typeof result.solar_system_id).toBe('number');
        expect(result).toHaveProperty('owner_id');
        expect(typeof result.owner_id).toBe('number');
        expect(result).toHaveProperty('position');
        expect(typeof result.position).toBe('object');
        expect(result.position).toHaveProperty('x');
        expect(typeof result.position.x).toBe('number');
        expect(result.position).toHaveProperty('y');
        expect(typeof result.position.y).toBe('number');
        expect(result.position).toHaveProperty('z');
        expect(typeof result.position.z).toBe('number');
    });
});
