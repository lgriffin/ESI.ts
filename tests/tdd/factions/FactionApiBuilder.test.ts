import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { FactionAPIBuilder } from '../../../src/builders/FactionApiBuilder';
import { getConfig } from '../../../src/config/configManager';

describe('FactionApiBuilder', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    it('should build a FactionClient instance', () => {
        const builder = new FactionAPIBuilder(client);
        const factionClient = builder.build();
        expect(factionClient).toBeDefined();
        expect(factionClient.getCharacterStats).toBeInstanceOf(Function);
        expect(factionClient.getLeaderboardsCharacters).toBeInstanceOf(Function);
        expect(factionClient.getLeaderboardsCorporations).toBeInstanceOf(Function);
        expect(factionClient.getLeaderboardsOverall).toBeInstanceOf(Function);
        expect(factionClient.getStats).toBeInstanceOf(Function);
        expect(factionClient.getCorporationStats).toBeInstanceOf(Function);
        expect(factionClient.getSystems).toBeInstanceOf(Function);
        expect(factionClient.getWars).toBeInstanceOf(Function);
    });
});
