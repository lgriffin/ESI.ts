import { UniverseClient } from '../../../src/clients/UniverseClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
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
        short_description: 'Short description 1',
      },
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/ancestries',
    );
  });

  it('should return valid asteroid belt information', async () => {
    const mockResponse = {
      asteroid_belt_id: 1,
      name: 'Asteroid Belt 1',
      system_id: 30000001,
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => universeClient.getAsteroidBeltInfo(1));

    expect(result).toHaveProperty('asteroid_belt_id');
    expect(result.asteroid_belt_id).toBe(1);
    expect(result).toHaveProperty('name');
    expect(typeof result.name).toBe('string');
    expect(result).toHaveProperty('system_id');
    expect(typeof result.system_id).toBe('number');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/asteroid_belts/1',
    );
  });

  it('should return valid bloodlines', async () => {
    const mockResponse = [
      {
        bloodline_id: 1,
        name: 'Bloodline 1',
        description: 'Description 1',
        race_id: 1,
      },
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/bloodlines',
    );
  });

  it('should return valid constellation information by ID', async () => {
    const mockResponse = {
      constellation_id: 1,
      name: 'Constellation 1',
      region_id: 10000001,
      systems: [30000001, 30000002],
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/constellations/1',
    );
  });

  it('should return valid constellations', async () => {
    const mockResponse = [
      {
        constellation_id: 1,
        name: 'Constellation 1',
        region_id: 10000001,
        systems: [30000001, 30000002],
      },
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/constellations',
    );
  });

  // Continue writing tests for other UniverseClient methods in a similar manner

  it('should return valid factions', async () => {
    const mockResponse = [
      {
        faction_id: 1,
        name: 'Faction 1',
        description: 'Description 1',
      },
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/factions',
    );
  });

  it('should return valid graphics', async () => {
    const mockResponse = [
      {
        graphic_id: 1,
        url: 'https://example.com/graphic1.png',
        description: 'Description 1',
      },
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/graphics',
    );
  });

  it('should return valid graphic information by ID', async () => {
    const mockResponse = {
      graphic_id: 1,
      url: 'https://example.com/graphic1.png',
      description: 'Description 1',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => universeClient.getGraphicById(1));

    expect(result).toHaveProperty('graphic_id');
    expect(result.graphic_id).toBe(1);
    expect(result).toHaveProperty('url');
    expect(typeof result.url).toBe('string');
    expect(result).toHaveProperty('description');
    expect(typeof result.description).toBe('string');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/graphics/1',
    );
  });

  it('should return valid schematic information', async () => {
    const mockResponse = {
      schematic_id: 1,
      name: 'Test Schematic',
      description: 'A test schematic description',
      cycle_time: 300,
      materials: [
        {
          type_id: 34,
          quantity: 1,
        },
      ],
      products: [
        {
          type_id: 35,
          quantity: 1,
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => universeClient.getSchematicById(1));

    expect(result).toHaveProperty('schematic_id');
    expect(result.schematic_id).toBe(1);
    expect(result).toHaveProperty('name');
    expect(typeof result.name).toBe('string');
    expect(result).toHaveProperty('description');
    expect(typeof result.description).toBe('string');
    expect(result).toHaveProperty('cycle_time');
    expect(typeof result.cycle_time).toBe('number');
    expect(result).toHaveProperty('materials');
    expect(Array.isArray(result.materials)).toBe(true);
    expect(result).toHaveProperty('products');
    expect(Array.isArray(result.products)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/schematics/1',
    );
  });

  it('should return valid regions list', async () => {
    const mockResponse = [10000001, 10000002, 10000003, 10000004, 10000005];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => universeClient.getRegions());

    expect(Array.isArray(result)).toBe(true);
    result.forEach((regionId: number) => {
      expect(typeof regionId).toBe('number');
      expect(regionId).toBeGreaterThan(0);
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/regions',
    );
  });

  it('should return valid item categories', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([1, 2, 3]));
    const result = await getBody(() => universeClient.getItemCategories());
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/categories',
    );
  });

  it('should return valid item category by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ category_id: 6, name: 'Ship', groups: [25, 26] }),
    );
    const result = await getBody(() => universeClient.getItemCategoryById(6));
    expect(result.category_id).toBe(6);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/categories/6',
    );
  });

  it('should return valid item group by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ group_id: 25, name: 'Frigate', types: [587, 603] }),
    );
    const result = await getBody(() => universeClient.getItemGroupById(25));
    expect(result.group_id).toBe(25);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/groups/25',
    );
  });

  it('should return valid item groups', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([25, 26, 27]));
    const result = await getBody(() => universeClient.getItemGroups());
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/groups',
    );
  });

  it('should return valid moon info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        moon_id: 40000001,
        name: 'Moon I',
        system_id: 30000001,
      }),
    );
    const result = await getBody(() => universeClient.getMoonById(40000001));
    expect(result.moon_id).toBe(40000001);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/moons/40000001',
    );
  });

  it('should return valid planet info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        planet_id: 40000002,
        name: 'Planet I',
        system_id: 30000001,
      }),
    );
    const result = await getBody(() => universeClient.getPlanetById(40000002));
    expect(result.planet_id).toBe(40000002);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/planets/40000002',
    );
  });

  it('should return valid races', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([{ race_id: 1, name: 'Caldari', description: 'A race' }]),
    );
    const result = await getBody(() => universeClient.getRaces());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].race_id).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/races',
    );
  });

  it('should return valid region info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        region_id: 10000002,
        name: 'The Forge',
        constellations: [20000001],
      }),
    );
    const result = await getBody(() => universeClient.getRegionById(10000002));
    expect(result.region_id).toBe(10000002);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/regions/10000002',
    );
  });

  it('should return valid star info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        star_id: 40000099,
        name: 'Jita Star',
        spectral_class: 'K2 V',
      }),
    );
    const result = await getBody(() => universeClient.getStarById(40000099));
    expect(result.star_id).toBe(40000099);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/stars/40000099',
    );
  });

  it('should return valid stargate info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        stargate_id: 50000001,
        name: 'Jita-Perimeter',
        system_id: 30000142,
      }),
    );
    const result = await getBody(() =>
      universeClient.getStargateById(50000001),
    );
    expect(result.stargate_id).toBe(50000001);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/stargates/50000001',
    );
  });

  it('should return valid station info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        station_id: 60003760,
        name: 'Jita IV - Moon 4',
        system_id: 30000142,
      }),
    );
    const result = await getBody(() => universeClient.getStationById(60003760));
    expect(result.station_id).toBe(60003760);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/stations/60003760',
    );
  });

  it('should return valid structure info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        structure_id: 1000000001,
        name: 'My Citadel',
        solar_system_id: 30000142,
      }),
    );
    const result = await getBody(() =>
      universeClient.getStructureById(1000000001),
    );
    expect(result.structure_id).toBe(1000000001);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/structures/1000000001',
    );
  });

  it('should return valid structures list', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([1000000001, 1000000002]));
    const result = await getBody(() => universeClient.getStructures());
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/structures',
    );
  });

  it('should return valid system info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        system_id: 30000142,
        name: 'Jita',
        security_status: 0.9459,
      }),
    );
    const result = await getBody(() => universeClient.getSystemById(30000142));
    expect(result.system_id).toBe(30000142);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/systems/30000142',
    );
  });

  it('should return valid system jumps', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([{ system_id: 30000142, ship_jumps: 100 }]),
    );
    const result = await getBody(() => universeClient.getSystemJumps());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].ship_jumps).toBe(100);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/system_jumps',
    );
  });

  it('should return valid system kills', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([{ system_id: 30000142, ship_kills: 50, npc_kills: 200 }]),
    );
    const result = await getBody(() => universeClient.getSystemKills());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].ship_kills).toBe(50);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/system_kills',
    );
  });

  it('should return valid systems list', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([30000001, 30000002]));
    const result = await getBody(() => universeClient.getSystems());
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/systems',
    );
  });

  it('should return valid type info by ID', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        type_id: 587,
        name: 'Rifter',
        description: 'A frigate',
      }),
    );
    const result = await getBody(() => universeClient.getTypeById(587));
    expect(result.type_id).toBe(587);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/types/587',
    );
  });

  it('should return valid types list', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([587, 603, 621]));
    const result = await getBody(() => universeClient.getTypes());
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/types',
    );
  });

  it('should resolve names to IDs via postBulkNamesToIds', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ characters: [{ id: 123, name: 'Pilot' }] }),
    );
    const result = await getBody(() =>
      universeClient.postBulkNamesToIds(['Pilot']),
    );
    expect(result).toHaveProperty('characters');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/ids',
    );
    const sentBody = fetchMock.mock.calls[0][1]?.body;
    expect(sentBody).toBe(JSON.stringify(['Pilot']));
  });

  it('should resolve IDs to names via postNamesAndCategories', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([{ id: 123, name: 'Pilot', category: 'character' }]),
    );
    const result = await getBody(() =>
      universeClient.postNamesAndCategories([123]),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].category).toBe('character');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/universe/names',
    );
    const sentBody = fetchMock.mock.calls[0][1]?.body;
    expect(sentBody).toBe(JSON.stringify([123]));
  });
});
