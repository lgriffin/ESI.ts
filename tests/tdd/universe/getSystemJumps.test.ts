import { UniverseSystemJumpsApi } from '../../../src/api/universe/getSystemJumps';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseSystemJumpsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeSystemJumpsApi = new UniverseSystemJumpsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getSystemJumps', async () => {
        const mockResponse = [
            {
                ship_jumps: 123,
                system_id: 30000142
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type SystemJumpResponse = {
            ship_jumps: number;
            system_id: number;
        };

        const result = await getBody(() => universeSystemJumpsApi.getSystemJumps()) as SystemJumpResponse[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((jump: SystemJumpResponse) => {
            expect(jump).toHaveProperty('ship_jumps');
            expect(typeof jump.ship_jumps).toBe('number');
            expect(jump).toHaveProperty('system_id');
            expect(typeof jump.system_id).toBe('number');
        });
    });
});
