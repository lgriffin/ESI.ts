import { UniverseClient } from '../../../src/clients/UniverseClient';
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

const universeClient = new UniverseClient(client);

describe('UniverseClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid ancestries', async () => {
        const mockResponse = [
            {
                ancestry_id: 1,
                name: 'Ancestry 1',
                bloodline_id: 1,
                description: 'Description 1',
                short_description: 'Short description 1'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeClient.getAncestries());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((ancestry: any) => {
            expect(ancestry).toHaveProperty('ancestry_id');
            expect(typeof ancestry.ancestry_id).toBe('number');
            expect(ancestry).toHaveProperty('name');
            expect(typeof ancestry.name).toBe('string');
            expect(ancestry).toHaveProperty('bloodline_id');
            expect(typeof ancestry.bloodline_id).toBe('number');
        });
    });

    it('should return valid asteroid belt information', async () => {
        const mockResponse = {
            asteroid_belt_id: 1,
            name: 'Asteroid Belt 1',
            system_id: 30000001
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeClient.getAsteroidBeltInfo(1));

        expect(result).toHaveProperty('asteroid_belt_id');
        expect(result.asteroid_belt_id).toBe(1);
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('system_id');
        expect(typeof result.system_id).toBe('number');
    });

    it('should return valid bloodlines', async () => {
        const mockResponse = [
            {
                bloodline_id: 1,
                name: 'Bloodline 1',
                description: 'Description 1',
                race_id: 1
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeClient.getBloodlines());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((bloodline: any) => {
            expect(bloodline).toHaveProperty('bloodline_id');
            expect(typeof bloodline.bloodline_id).toBe('number');
            expect(bloodline).toHaveProperty('name');
            expect(typeof bloodline.name).toBe('string');
            expect(bloodline).toHaveProperty('description');
            expect(typeof bloodline.description).toBe('string');
        });
    });

    it('should return valid constellation information by ID', async () => {
        const mockResponse = {
            constellation_id: 1,
            name: 'Constellation 1',
            region_id: 10000001,
            systems: [30000001, 30000002]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeClient.getConstellationById(1));

        expect(result).toHaveProperty('constellation_id');
        expect(result.constellation_id).toBe(1);
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('region_id');
        expect(typeof result.region_id).toBe('number');
        expect(result).toHaveProperty('systems');
        expect(Array.isArray(result.systems)).toBe(true);
        result.systems.forEach((system: any) => {
            expect(typeof system).toBe('number');
        });
    });

    it('should return valid constellations', async () => {
        const mockResponse = [
            {
                constellation_id: 1,
                name: 'Constellation 1',
                region_id: 10000001,
                systems: [30000001, 30000002]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeClient.getConstellations());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((constellation: any) => {
            expect(constellation).toHaveProperty('constellation_id');
            expect(typeof constellation.constellation_id).toBe('number');
            expect(constellation).toHaveProperty('name');
            expect(typeof constellation.name).toBe('string');
            expect(constellation).toHaveProperty('region_id');
            expect(typeof constellation.region_id).toBe('number');
            expect(constellation).toHaveProperty('systems');
            expect(Array.isArray(constellation.systems)).toBe(true);
            constellation.systems.forEach((system: any) => {
                expect(typeof system).toBe('number');
            });
        });
    });

    // Continue writing tests for other UniverseClient methods in a similar manner

    it('should return valid factions', async () => {
        const mockResponse = [
            {
                faction_id: 1,
                name: 'Faction 1',
                description: 'Description 1'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeClient.getFactions());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((faction: any) => {
            expect(faction).toHaveProperty('faction_id');
            expect(typeof faction.faction_id).toBe('number');
            expect(faction).toHaveProperty('name');
            expect(typeof faction.name).toBe('string');
            expect(faction).toHaveProperty('description');
            expect(typeof faction.description).toBe('string');
        });
    });

    it('should return valid graphics', async () => {
        const mockResponse = [
            {
                graphic_id: 1,
                url: 'https://example.com/graphic1.png',
                description: 'Description 1'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeClient.getGraphics());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((graphic: any) => {
            expect(graphic).toHaveProperty('graphic_id');
            expect(typeof graphic.graphic_id).toBe('number');
            expect(graphic).toHaveProperty('url');
            expect(typeof graphic.url).toBe('string');
            expect(graphic).toHaveProperty('description');
            expect(typeof graphic.description).toBe('string');
        });
    });

    it('should return valid graphic information by ID', async () => {
        const mockResponse = {
            graphic_id: 1,
            url: 'https://example.com/graphic1.png',
            description: 'Description 1'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeClient.getGraphicById(1));

        expect(result).toHaveProperty('graphic_id');
        expect(result.graphic_id).toBe(1);
        expect(result).toHaveProperty('url');
        expect(typeof result.url).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
    });
});
