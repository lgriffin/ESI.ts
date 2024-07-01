import { UniversePlanetByIdApi } from '../../../src/api/universe/getPlanetById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniversePlanetByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universePlanetByIdApi = new UniversePlanetByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getPlanetById', async () => {
        const mockResponse = {
            planet_id: 1,
            name: 'Planet 1',
            type: 'PlanetType',
            position: {
                x: 0,
                y: 0,
                z: 0
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type PlanetResponse = {
            planet_id: number;
            name: string;
            type: string;
            position: {
                x: number;
                y: number;
                z: number;
            };
        };

        const result = await universePlanetByIdApi.getPlanetById(1) as PlanetResponse;

        expect(result).toHaveProperty('planet_id');
        expect(typeof result.planet_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('type');
        expect(typeof result.type).toBe('string');
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
