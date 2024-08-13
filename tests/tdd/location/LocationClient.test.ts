import { LocationClient } from '../../../src/clients/LocationClient';
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

const locationClient = new LocationClient(client);

describe('LocationClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getCharacterLocation', async () => {
        const mockResponse = {
            solar_system_id: 30002510,
            station_id: 60015068,
            structure_id: 1020988381992
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => locationClient.getCharacterLocation(123456));

        expect(result).toHaveProperty('solar_system_id');
        expect(typeof result.solar_system_id).toBe('number');
        expect(result).toHaveProperty('station_id');
        expect(typeof result.station_id).toBe('number');
        expect(result).toHaveProperty('structure_id');
        expect(typeof result.structure_id).toBe('number');
    });

    it('should return valid structure for getCharacterOnline', async () => {
        const mockResponse = {
            online: true,
            last_login: '2017-01-02T03:04:05Z',
            last_logout: '2017-01-02T03:04:05Z',
            logins: 9001
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => locationClient.getCharacterOnline(123456));

        expect(result).toHaveProperty('online');
        expect(typeof result.online).toBe('boolean');
        expect(result).toHaveProperty('last_login');
        expect(typeof result.last_login).toBe('string');
        expect(result).toHaveProperty('last_logout');
        expect(typeof result.last_logout).toBe('string');
        expect(result).toHaveProperty('logins');
        expect(typeof result.logins).toBe('number');
    });

    it('should return valid structure for getCharacterShip', async () => {
        const mockResponse = {
            ship_item_id: 1000000016991,
            ship_name: "SPACESHIP",
            ship_type_id: 1233
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => locationClient.getCharacterShip(123456));

        expect(result).toHaveProperty('ship_item_id');
        expect(typeof result.ship_item_id).toBe('number');
        expect(result).toHaveProperty('ship_name');
        expect(typeof result.ship_name).toBe('string');
        expect(result).toHaveProperty('ship_type_id');
        expect(typeof result.ship_type_id).toBe('number');
    });
});
