import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { WarsClient } from '../../../src/clients/WarsClient';
import { WarsApi } from '../../../src/api/wars/getWars';
import { WarByIdApi } from '../../../src/api/wars/getWarById';
import { WarKillmailsApi } from '../../../src/api/wars/getWarKillmails';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('WarsClient', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    const warsClient = new WarsClient(
        new WarsApi(client),
        new WarByIdApi(client),
        new WarKillmailsApi(client)
    );

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getWars', async () => {
        const mockResponse = [{ war_id: 1 }, { war_id: 2 }];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await warsClient.getWars();
        expect(Array.isArray(result)).toBe(true);
        result.forEach((war: any) => {
            expect(war).toHaveProperty('war_id');
            expect(typeof war.war_id).toBe('number');
        });
    });

    it('should return valid structure for getWarById', async () => {
        const mockResponse = { war_id: 1, declared: '2023-01-01', finished: '2023-01-10' };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await warsClient.getWarById(1);
        expect(result).toHaveProperty('war_id');
        expect(result).toHaveProperty('declared');
        expect(result).toHaveProperty('finished');
    });

    it('should return valid structure for getWarKillmails', async () => {
        const mockResponse = [{ killmail_id: 1, killmail_time: '2023-01-01' }, { killmail_id: 2, killmail_time: '2023-01-02' }];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await warsClient.getWarKillmails(1);
        expect(Array.isArray(result)).toBe(true);
        result.forEach((killmail: any) => {
            expect(killmail).toHaveProperty('killmail_id');
            expect(killmail).toHaveProperty('killmail_time');
        });
    });
});
