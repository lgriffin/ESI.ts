import { UniverseSystemKillsApi } from '../../../src/api/universe/getSystemKills';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseSystemKillsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeSystemKillsApi = new UniverseSystemKillsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getSystemKills', async () => {
        const mockResponse = [
            {
                ship_kills: 5,
                system_id: 30000142
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type SystemKillResponse = {
            ship_kills: number;
            system_id: number;
        };

        const result = await getBody(() => universeSystemKillsApi.getSystemKills()) as SystemKillResponse[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((kill: SystemKillResponse) => {
            expect(kill).toHaveProperty('ship_kills');
            expect(typeof kill.ship_kills).toBe('number');
            expect(kill).toHaveProperty('system_id');
            expect(typeof kill.system_id).toBe('number');
        });
    });
});
