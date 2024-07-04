import { ApiClient } from '../../../src/core/ApiClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { UniverseAPIBuilder } from '../../../src/builders/UniverseApiBuilder';
import { UniverseClient } from '../../../src/clients/UniverseClient';

describe('UniverseApiBuilder', () => {
    let client: ApiClient;
    let universeApiBuilder: UniverseAPIBuilder;

    beforeAll(() => {
        const config = getConfig();
        client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        universeApiBuilder = new UniverseAPIBuilder(client);
    });

    it('should build UniverseClient', () => {
        const universeClient = universeApiBuilder.build();
        expect(universeClient).toBeInstanceOf(UniverseClient);
    });

    it('should have all UniverseClient methods', () => {
        const universeClient = universeApiBuilder.build();

        expect(typeof universeClient.getAncestries).toBe('function');
        expect(typeof universeClient.getAsteroidBeltInfo).toBe('function');
        expect(typeof universeClient.getBloodlines).toBe('function');
        expect(typeof universeClient.getConstellationById).toBe('function');
        expect(typeof universeClient.getConstellations).toBe('function');
        expect(typeof universeClient.getFactions).toBe('function');
        expect(typeof universeClient.getGraphicById).toBe('function');
        expect(typeof universeClient.getGraphics).toBe('function');
        expect(typeof universeClient.getItemCategories).toBe('function');
        expect(typeof universeClient.getItemCategoryById).toBe('function');
        expect(typeof universeClient.getItemGroupById).toBe('function');
        expect(typeof universeClient.getItemGroups).toBe('function');
        expect(typeof universeClient.getMoonById).toBe('function');
        expect(typeof universeClient.getPlanetById).toBe('function');
        expect(typeof universeClient.getRaces).toBe('function');
        expect(typeof universeClient.getRegionById).toBe('function');
        expect(typeof universeClient.getStarById).toBe('function');
        expect(typeof universeClient.getStargateById).toBe('function');
        expect(typeof universeClient.getStationById).toBe('function');
        expect(typeof universeClient.getStructureById).toBe('function');
        expect(typeof universeClient.getStructures).toBe('function');
        expect(typeof universeClient.getSystemById).toBe('function');
        expect(typeof universeClient.getSystemJumps).toBe('function');
        expect(typeof universeClient.getSystemKills).toBe('function');
        expect(typeof universeClient.getSystems).toBe('function');
        expect(typeof universeClient.getTypeById).toBe('function');
        expect(typeof universeClient.getTypes).toBe('function');
        expect(typeof universeClient.postBulkNamesToIds).toBe('function');
        expect(typeof universeClient.postNamesAndCategories).toBe('function');
    });
});
