import { UniverseMoonByIdApi } from '../../../src/api/universe/getMoonById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseMoonByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeMoonByIdApi = new UniverseMoonByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getMoonById', async () => {
        const mockResponse = {
            moon_id: 1,
            name: 'Moon 1',
            position: {
                x: 0,
                y: 0,
                z: 0
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type MoonResponse = {
            moon_id: number;
            name: string;
            position: {
                x: number;
                y: number;
                z: number;
            };
        };

        const result = await getBody(() => universeMoonByIdApi.getMoonById(1)) as MoonResponse;

        expect(result).toHaveProperty('moon_id');
        expect(typeof result.moon_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
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
