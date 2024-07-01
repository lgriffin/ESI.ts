import { UniverseFactionsApi } from '../../../src/api/universe/getFactions';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseFactionsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeFactionsApi = new UniverseFactionsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getFactions', async () => {
        const mockResponse = [{ faction_id: 1, name: 'Faction 1' }, { faction_id: 2, name: 'Faction 2' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await universeFactionsApi.getFactions();
        expect(Array.isArray(result)).toBe(true);
        result.forEach((faction: any) => {
            expect(faction).toHaveProperty('faction_id');
            expect(typeof faction.faction_id).toBe('number');
            expect(faction).toHaveProperty('name');
            expect(typeof faction.name).toBe('string');
        });
    });
});
