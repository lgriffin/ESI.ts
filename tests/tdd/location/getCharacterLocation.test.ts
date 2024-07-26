import { GetCharacterLocationApi } from '../../../src/api/location/getCharacterLocation';
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

const characterLocationApi = new GetCharacterLocationApi(client);

describe('GetCharacterLocationApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character location', async () => {
        const mockResponse = {
            solar_system_id: 30002510,
            station_id: 60015068,
            structure_id: 1020988381992
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await characterLocationApi.getCharacterLocation(123456);

        expect(result).toHaveProperty('solar_system_id');
        expect(typeof result.solar_system_id).toBe('number');
        expect(result).toHaveProperty('station_id');
        expect(typeof result.station_id).toBe('number');
        expect(result).toHaveProperty('structure_id');
        expect(typeof result.structure_id).toBe('number');
    });
});
