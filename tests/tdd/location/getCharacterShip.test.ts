import { GetCharacterShipApi } from '../../../src/api/location/getCharacterShip';
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

const characterShipApi = new GetCharacterShipApi(client);

describe('GetCharacterShipApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character ship', async () => {
        const mockResponse = {
            ship_item_id: 1000000016991,
            ship_name: "SPACESHIP",
            ship_type_id: 1233
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterShipApi.getCharacterShip(123456));

        expect(result).toHaveProperty('ship_item_id');
        expect(typeof result.ship_item_id).toBe('number');
        expect(result).toHaveProperty('ship_name');
        expect(typeof result.ship_name).toBe('string');
        expect(result).toHaveProperty('ship_type_id');
        expect(typeof result.ship_type_id).toBe('number');
    });
});
