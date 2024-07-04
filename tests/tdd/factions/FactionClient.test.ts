import { ApiClient } from '../../../src/core/ApiClient';
import { FactionClient } from '../../../src/clients/FactionClient';
import { FactionWarfareLeaderboardsApi } from '../../../src/api/factions/getFactionWarfareLeaderboards';
import { FactionWarfareStatsApi } from '../../../src/api/factions/getFactionWarfareStats';
import { FactionWarfareSystemsApi } from '../../../src/api/factions/getFactionWarfareSystems';
import { FactionWarfareWarsApi } from '../../../src/api/factions/getFactionWarfareWars';

jest.mock('../../src/api/factions/getFactionWarfareLeaderboards');
jest.mock('../../src/api/factions/getFactionWarfareStats');
jest.mock('../../src/api/factions/getFactionWarfareSystems');
jest.mock('../../src/api/factions/getFactionWarfareWars');

describe('FactionClient', () => {
    let client: ApiClient;
    let factionClient: FactionClient;

    beforeEach(() => {
        client = new ApiClient('clientId', 'link', 'authToken');
        factionClient = new FactionClient(client);
    });

    it('should instantiate FactionWarfareLeaderboardsApi, FactionWarfareStatsApi, FactionWarfareSystemsApi, and FactionWarfareWarsApi', () => {
        expect(factionClient['factionWarfareLeaderboardsApi']).toBeInstanceOf(FactionWarfareLeaderboardsApi);
        expect(factionClient['factionWarfareStatsApi']).toBeInstanceOf(FactionWarfareStatsApi);
        expect(factionClient['factionWarfareSystemsApi']).toBeInstanceOf(FactionWarfareSystemsApi);
        expect(factionClient['factionWarfareWarsApi']).toBeInstanceOf(FactionWarfareWarsApi);
    });

    it('should call getCharacters on FactionWarfareLeaderboardsApi', async () => {
        const getCharactersMock = jest.fn();
        (FactionWarfareLeaderboardsApi as jest.Mock).mockImplementation(() => {
            return { getCharacters: getCharactersMock };
        });
        await factionClient.getLeaderboardsCharacters();
        expect(getCharactersMock).toHaveBeenCalled();
    });

    it('should call getStats on FactionWarfareStatsApi', async () => {
        const getStatsMock = jest.fn();
        (FactionWarfareStatsApi as jest.Mock).mockImplementation(() => {
            return { getStats: getStatsMock };
        });
        await factionClient.getStats();
        expect(getStatsMock).toHaveBeenCalled();
    });

    it('should call getSystems on FactionWarfareSystemsApi', async () => {
        const getSystemsMock = jest.fn();
        (FactionWarfareSystemsApi as jest.Mock).mockImplementation(() => {
            return { getSystems: getSystemsMock };
        });
        await factionClient.getSystems();
        expect(getSystemsMock).toHaveBeenCalled();
    });

    it('should call getWars on FactionWarfareWarsApi', async () => {
        const getWarsMock = jest.fn();
        (FactionWarfareWarsApi as jest.Mock).mockImplementation(() => {
            return { getWars: getWarsMock };
        });
        await factionClient.getWars();
        expect(getWarsMock).toHaveBeenCalled();
    });
});
