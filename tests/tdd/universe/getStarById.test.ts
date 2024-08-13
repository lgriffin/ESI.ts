import { UniverseStarByIdApi } from '../../../src/api/universe/getStarById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseStarByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeStarByIdApi = new UniverseStarByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getStarById', async () => {
        const mockResponse = {
            star_id: 40000001,
            name: 'Star Alpha',
            spectral_class: 'K5 V',
            age: 5000000000,
            luminosity: 1.0
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type StarResponse = {
            star_id: number;
            name: string;
            spectral_class: string;
            age: number;
            luminosity: number;
        };

        const result = await getBody(() => universeStarByIdApi.getStarById(40000001)) as StarResponse;

        expect(result).toHaveProperty('star_id');
        expect(typeof result.star_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('spectral_class');
        expect(typeof result.spectral_class).toBe('string');
        expect(result).toHaveProperty('age');
        expect(typeof result.age).toBe('number');
        expect(result).toHaveProperty('luminosity');
        expect(typeof result.luminosity).toBe('number');
    });
});
