import { UniverseSystemByIdApi } from '../../../src/api/universe/getSystemById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseSystemByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeSystemByIdApi = new UniverseSystemByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getSystemById', async () => {
        const mockResponse = {
            system_id: 30000142,
            name: 'Jita',
            constellation_id: 20000020,
            security_status: 0.9
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type SystemResponse = {
            system_id: number;
            name: string;
            constellation_id: number;
            security_status: number;
        };

        const result = await getBody(() => universeSystemByIdApi.getSystemById(30000142)) as SystemResponse;

        expect(result).toHaveProperty('system_id');
        expect(typeof result.system_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('constellation_id');
        expect(typeof result.constellation_id).toBe('number');
        expect(result).toHaveProperty('security_status');
        expect(typeof result.security_status).toBe('number');
    });
});
