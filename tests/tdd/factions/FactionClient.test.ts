import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { FactionClient } from '../../../src/clients/FactionClient';
import { FactionWarfareLeaderboardsApi } from '../../../src/api/factions/getFactionWarfareLeaderboards';
import { FactionWarfareStatsApi } from '../../../src/api/factions/getFactionWarfareStats';
import { FactionWarfareSystemsApi } from '../../../src/api/factions/getFactionWarfareSystems';
import { FactionWarfareWarsApi } from '../../../src/api/factions/getFactionWarfareWars';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('FactionClient', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    const factionWarfareLeaderboardsApi = new FactionWarfareLeaderboardsApi(client);
    const factionWarfareStatsApi = new FactionWarfareStatsApi(client);
    const factionWarfareSystemsApi = new FactionWarfareSystemsApi(client);
    const factionWarfareWarsApi = new FactionWarfareWarsApi(client);

    const factionClient = new FactionClient(
        factionWarfareLeaderboardsApi,
        factionWarfareStatsApi,
        factionWarfareSystemsApi,
        factionWarfareWarsApi
    );

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should call getCharacterStats and return a valid response', async () => {
        const characterId = 1689391488;
        const mockResponse = { character_id: characterId, kills: 100 };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getCharacterStats(characterId);
        expect(result.character_id).toBe(characterId);
        expect(result.kills).toBe(100);
    });

    // TODO Add similar tests for other methods like getLeaderboardsCharacters, getLeaderboardsCorporations, etc.
});
