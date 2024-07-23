import { GetCharacterFleetInfoApi } from '../../../src/api/fleets/getCharacterFleetInfo';
import fetchMock from 'jest-fetch-mock';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();
fetchMock.enableMocks();


const characterFleetInfoApi = new GetCharacterFleetInfoApi(client);

describe('GetCharacterFleetInfoApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid character fleet info', async () => {
        const mockResponse = {
            fleet_id: 1234567890,
            role: 'fleet_commander',
            squad_id: 987654321,
            wing_id: 123456789
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await characterFleetInfoApi.getCharacterFleetInfo(123456789);

        expect(result).toHaveProperty('fleet_id');
        expect(result).toHaveProperty('role');
        expect(result).toHaveProperty('squad_id');
        expect(result).toHaveProperty('wing_id');
    });
});
