import { UniverseStationByIdApi } from '../../../src/api/universe/getStationById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseStationByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeStationByIdApi = new UniverseStationByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getStationById', async () => {
        const mockResponse = {
            station_id: 600001,
            name: 'Station Alpha',
            type_id: 30000001,
            system_id: 30002510,
            owner: 1000171,
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type StationResponse = {
            station_id: number;
            name: string;
            type_id: number;
            system_id: number;
            owner: number;
        };

        const result = await universeStationByIdApi.getStationById(600001) as StationResponse;

        expect(result).toHaveProperty('station_id');
        expect(typeof result.station_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('type_id');
        expect(typeof result.type_id).toBe('number');
        expect(result).toHaveProperty('system_id');
        expect(typeof result.system_id).toBe('number');
        expect(result).toHaveProperty('owner');
        expect(typeof result.owner).toBe('number');
    });
});
