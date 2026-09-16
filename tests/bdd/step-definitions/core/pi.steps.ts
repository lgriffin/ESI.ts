import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0028-pi.feature');

const BEARER = 'Bearer bdd-access-token';

/**
 * Match a URL whose path is exactly `path` (query string allowed), so the
 * colony listing does not also serve a colony layout.
 */
function exactPath(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https://esi\\.evetech\\.net${escaped}(\\?|$)`);
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Two colonies return their planet type and upgrade level', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;

    given('a valid character ID for PI', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/planets`),
        body: [
          {
            planet_id: 40000001,
            planet_type: 'temperate',
            solar_system_id: 30000142,
            num_pins: 8,
            last_update: '2024-03-15T10:00:00Z',
            owner_id: characterId,
            upgrade_level: 5,
          },
          {
            planet_id: 40000002,
            planet_type: 'barren',
            solar_system_id: 30000142,
            num_pins: 6,
            last_update: '2024-03-14T08:00:00Z',
            owner_id: characterId,
            upgrade_level: 4,
          },
        ],
      });
    });

    when('the client requests planetary colonies', async () => {
      result = await client.pi.getColonies(characterId);
    });

    then('the client shall return a list of colonies', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe(`/characters/${characterId}/planets`);
      expect(request.headers.authorization).toBe(BEARER);
      expect(
        result.map((colony: any) => [
          colony.planet_id,
          colony.planet_type,
          colony.upgrade_level,
        ]),
      ).toEqual([
        [40000001, 'temperate', 5],
        [40000002, 'barren', 4],
      ]);
    });
  });

  test('Character with no colonies receives an empty array', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;

    given('a character with no PI colonies', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/planets`),
        body: [],
      });
    });

    when('the client requests colonies', async () => {
      result = await client.pi.getColonies(characterId);
    });

    then('the client shall return an empty colony array', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('Two-pin colony returns the link joining its pins', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;
    const planetId = 40000001;
    const expectedLayout = {
      pins: [
        {
          pin_id: 1001,
          type_id: 2254,
          latitude: 0.5,
          longitude: 1.2,
          schematic_id: 130,
        },
        {
          pin_id: 1002,
          type_id: 2256,
          latitude: 0.6,
          longitude: 1.3,
        },
      ],
      links: [{ source_pin_id: 1001, destination_pin_id: 1002, link_level: 0 }],
      routes: [
        {
          route_id: 5001,
          source_pin_id: 1001,
          destination_pin_id: 1002,
          content_type_id: 2389,
          quantity: 100,
        },
      ],
    };

    given('a character ID and planet ID', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/planets/${planetId}`),
        body: expectedLayout,
      });
    });

    when('the client requests the colony layout', async () => {
      result = await client.pi.getColonyLayout(characterId, planetId);
    });

    then('the client shall return pins, links, and routes', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/planets/${planetId}`,
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(result.pins.map((pin: any) => pin.pin_id)).toEqual([1001, 1002]);
      expect(result.links).toEqual([
        { source_pin_id: 1001, destination_pin_id: 1002, link_level: 0 },
      ]);
      expect(result.routes).toEqual(expectedLayout.routes);
    });
  });

  test('Colony with nothing built returns three empty arrays', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90000001;
    const planetId = 40000003;

    given('a colony with no structures', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/planets/${planetId}`),
        body: { pins: [], links: [], routes: [] },
      });
    });

    when('the client requests the layout', async () => {
      result = await client.pi.getColonyLayout(characterId, planetId);
    });

    then('the client shall return empty arrays', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual({ pins: [], links: [], routes: [] });
    });
  });

  test('Bacteria schematic returns its name and cycle time', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const schematicId = 130;

    given('a valid schematic ID', () => {
      // ESI returns only the name and cycle time; the ID is the path key.
      queueResponse({
        match: exactPath(`/universe/schematics/${schematicId}`),
        body: { schematic_name: 'Bacteria', cycle_time: 1800 },
      });
    });

    when('the client requests the schematic', async () => {
      result = await client.pi.getSchematicInformation(schematicId);
    });

    then('the client shall return schematic details', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(`/universe/schematics/${schematicId}`);
      expect(result).toEqual({ schematic_name: 'Bacteria', cycle_time: 1800 });
    });
  });

  test('Unknown schematic ID is rejected with 404', ({ given, when, then }) => {
    let caughtError: any;
    const schematicId = 999999;

    given('an invalid schematic ID', () => {
      queueError(404, 'Schematic not found', {
        match: exactPath(`/universe/schematics/${schematicId}`),
      });
    });

    when('the client requests the invalid schematic', async () => {
      try {
        await client.pi.getSchematicInformation(schematicId);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 404 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Two customs offices return their office and system IDs', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 1344654522;

    given('a valid corporation ID for customs offices', () => {
      queueResponse({
        match: exactPath(`/corporations/${corporationId}/customs_offices`),
        body: [
          {
            office_id: 1041234567890,
            system_id: 30000142,
            reinforce_exit_start: 18,
            reinforce_exit_end: 21,
            allow_alliance_access: true,
            allow_access_with_standings: true,
            alliance_tax_rate: 0.1,
            corporation_tax_rate: 0.05,
            standing_level: 'terrible',
            terrible_standing_tax_rate: 0.5,
          },
          {
            office_id: 1041234567891,
            system_id: 30000143,
            reinforce_exit_start: 0,
            reinforce_exit_end: 3,
            allow_alliance_access: false,
            allow_access_with_standings: false,
            corporation_tax_rate: 0.05,
          },
        ],
      });
    });

    when('the client requests customs offices', async () => {
      result = await client.pi.getCorporationCustomsOffices(corporationId);
    });

    then('the client shall return a list of customs offices', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(
        `/corporations/${corporationId}/customs_offices`,
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(
        result.map((office: any) => [office.office_id, office.system_id]),
      ).toEqual([
        [1041234567890, 30000142],
        [1041234567891, 30000143],
      ]);
    });
  });

  test('Customs office request without the corporation role is rejected with 403', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;
    const corporationId = 1344654522;

    given('insufficient permissions for customs offices', () => {
      queueError(403, 'Character does not have required role(s)', {
        match: exactPath(`/corporations/${corporationId}/customs_offices`),
      });
    });

    when(
      'the client requests customs offices without permissions',
      async () => {
        try {
          await client.pi.getCorporationCustomsOffices(corporationId);
        } catch (e) {
          caughtError = e;
        }
      },
    );

    then('the client shall return a 403 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Planet ID from the colony listing drives the follow-up layout request', ({
    given,
    when,
    then,
  }) => {
    let allColonies: any;
    let colonyLayout: any;
    const characterId = 90000001;
    // A planet ID the scenario never hard-codes into the layout call.
    const listedPlanetId = 40000517;

    given('a character with colonies for workflow', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/planets`),
        body: [
          {
            planet_id: listedPlanetId,
            planet_type: 'temperate',
            solar_system_id: 30000142,
            num_pins: 5,
            last_update: '2024-03-15T10:00:00Z',
            owner_id: characterId,
            upgrade_level: 5,
          },
        ],
      });
      queueResponse({
        match: exactPath(
          `/characters/${characterId}/planets/${listedPlanetId}`,
        ),
        body: {
          pins: [
            { pin_id: 1001, type_id: 2254, latitude: 0.5, longitude: 1.2 },
          ],
          links: [],
          routes: [],
        },
      });
    });

    when('the client retrieves colonies and then their layouts', async () => {
      allColonies = await client.pi.getColonies(characterId);
      colonyLayout = await client.pi.getColonyLayout(
        characterId,
        allColonies[0].planet_id,
      );
    });

    then('the client shall have complete PI data', () => {
      expect(sentRequests().map((r) => r.url.pathname)).toEqual([
        `/characters/${characterId}/planets`,
        `/characters/${characterId}/planets/${listedPlanetId}`,
      ]);
      expect(allColonies.map((c: any) => c.planet_id)).toEqual([
        listedPlanetId,
      ]);
      expect(colonyLayout.pins.map((pin: any) => pin.pin_id)).toEqual([1001]);
    });
  });
});
