import fetchMock from 'jest-fetch-mock';
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

const feature = loadFeature('tests/bdd/features/core/0014-fleets.feature');

/**
 * Matches exactly one ESI path, with or without a trailing slash. `fleets/{id}`
 * would otherwise also match `fleets/{id}/members` and `fleets/{id}/wings/`.
 */
const esiPath = (path: string) =>
  new RegExp(`^https://esi\\.evetech\\.net/${path}/?(\\?|$)`);

const requestBody = () => {
  const body = lastRequest().body;
  return body === undefined ? undefined : JSON.parse(body);
};

/**
 * ESI answers fleet updates, kicks and moves with 204 No Content. The seam
 * encodes every response body as a string, and the Fetch `Response`
 * constructor refuses any body (even '') on a 204, so the seam cannot serve
 * one. The seam has already recorded the request and consumed the queued
 * entry by the time the constructor throws; this wrapper hands the client the
 * body-less 204 the seam meant to send. Call after useHttpTransport().
 */
function allowNoContentResponses(): void {
  beforeEach(() => {
    const serve = fetchMock.getMockImplementation();
    if (!serve) throw new Error('useHttpTransport() must be installed first');
    fetchMock.mockImplementation(async (input, init) => {
      try {
        return await serve(input, init);
      } catch (error) {
        if (/Invalid response status code 204/.test(String(error))) {
          return new Response(null, { status: 204 });
        }
        throw error;
      }
    });
  });
}

const fleetMember = (overrides: Record<string, unknown>) => ({
  character_id: 1689391488,
  join_time: '2024-01-15T18:00:00Z',
  role: 'squad_member',
  role_name: 'Squad Member (Squad 1)',
  ship_type_id: 17918,
  solar_system_id: 30000142,
  squad_id: 3129411261968,
  station_id: 60003760,
  takes_fleet_warp: true,
  wing_id: 2073711261968,
  ...overrides,
});

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();
  allowNoContentResponses();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Fleet commander sees their fleet ID and role', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('a character that is in a fleet', () => {
      queueResponse({
        match: esiPath(`characters/${characterId}/fleet`),
        body: {
          fleet_boss_id: characterId,
          fleet_id: 1234567890,
          role: 'fleet_commander',
          squad_id: -1,
          wing_id: -1,
        },
      });
    });

    when('the client requests their fleet info', async () => {
      result = await client.fleets.getCharacterFleetInfo(characterId);
    });

    then('the client shall return their fleet assignment details', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe(`/characters/${characterId}/fleet`);
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result.fleet_id).toBe(1234567890);
      expect(result.role).toBe('fleet_commander');
    });
  });

  test('Character who is not in any fleet', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('a character that is not in a fleet', () => {
      queueError(404, 'Character is not in a fleet', {
        match: esiPath(`characters/${characterId}/fleet`),
      });
    });

    when(
      'the client requests fleet info for the character not in a fleet',
      async () => {
        try {
          await client.fleets.getCharacterFleetInfo(characterId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the client shall return a 404 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      // 404 is not retryable: a single request.
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Fleet details include the MOTD and free-move flag', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const fleetId = 1234567890;

    given('a valid fleet ID', () => {
      // The payload ESI's GET /fleets/{fleet_id} documents: it carries no
      // fleet_id and no fleet_boss_id (see FleetsFleetIdGet in the generated
      // spec types). The Rule promises both, which the client cannot supply.
      queueResponse({
        match: esiPath(`fleets/${fleetId}`),
        body: {
          is_free_move: false,
          is_registered: true,
          is_voice_enabled: false,
          motd: 'Form up on titan',
        },
      });
    });

    when('the client requests fleet details', async () => {
      result = await client.fleets.getFleetInformation(fleetId);
    });

    then('the client shall return the fleet MOTD, boss, and settings', () => {
      expect(lastRequest().url.pathname).toBe(`/fleets/${fleetId}`);
      expect(result.motd).toBe('Form up on titan');
      expect(result.is_free_move).toBe(false);
      expect(result.fleet_id).toBe(fleetId);
      expect(typeof result.fleet_boss_id).toBe('number');
    });
  });

  test('Updating the MOTD and free-move flag', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const updateBody = {
      motd: 'Updated MOTD: Align to gate',
      is_free_move: true,
    };

    given('a fleet boss', () => {
      queueResponse({ match: esiPath(`fleets/${fleetId}`), status: 204 });
    });

    when(
      'the client updates the fleet MOTD and free-move setting',
      async () => {
        result = await client.fleets.updateFleet(fleetId, updateBody);
      },
    );

    then('the fleet update shall complete without error', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('PUT');
      expect(request.url.pathname).toBe(`/fleets/${fleetId}`);
      expect(requestBody()).toEqual(updateBody);
      expect(result).toBeUndefined();
    });
  });

  test('Member list covers commanders and squad members', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const fleetId = 1234567890;

    given('an active fleet with members', () => {
      queueResponse({
        match: esiPath(`fleets/${fleetId}/members`),
        body: [
          fleetMember({
            character_id: 1689391488,
            role: 'fleet_commander',
            role_name: 'Fleet Commander (Boss)',
            ship_type_id: 17918,
            solar_system_id: 30000142,
            squad_id: -1,
            wing_id: -1,
          }),
          fleetMember({
            character_id: 123456789,
            role: 'squad_member',
            ship_type_id: 24690,
            solar_system_id: 30000144,
            station_id: undefined,
          }),
          fleetMember({
            character_id: 111111111,
            role: 'wing_commander',
            role_name: 'Wing Commander (Wing 1)',
            ship_type_id: 17920,
            solar_system_id: 30000142,
            squad_id: -1,
          }),
        ],
      });
    });

    when('the client requests the member list', async () => {
      result = await client.fleets.getFleetMembers(fleetId);
    });

    then(
      'the client shall return member details including ships and roles',
      () => {
        expect(lastRequest().url.pathname).toBe(`/fleets/${fleetId}/members`);
        expect(
          result.map((m: any) => [
            m.character_id,
            m.role,
            m.ship_type_id,
            m.solar_system_id,
          ]),
        ).toEqual([
          [1689391488, 'fleet_commander', 17918, 30000142],
          [123456789, 'squad_member', 24690, 30000144],
          [111111111, 'wing_commander', 17920, 30000142],
        ]);
      },
    );
  });

  test('Kicking a member out of the fleet', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const memberId = 123456789;

    given('a fleet commander for kicking', () => {
      queueResponse({
        match: esiPath(`fleets/${fleetId}/members/${memberId}`),
        status: 204,
      });
    });

    when('the client kicks a member from the fleet', async () => {
      result = await client.fleets.kickFleetMember(fleetId, memberId);
    });

    then('the kick operation shall complete without error', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('DELETE');
      expect(request.url.pathname).toBe(
        `/fleets/${fleetId}/members/${memberId}/`,
      );
      expect(request.body).toBeUndefined();
      expect(result).toBeUndefined();
    });
  });

  test('Moving a member to another wing and squad', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const memberId = 123456789;
    const moveBody = {
      role: 'squad_member',
      wing_id: 2073711261968,
      squad_id: 3129411261968,
    };

    given('a fleet commander and a member', () => {
      queueResponse({
        match: esiPath(`fleets/${fleetId}/members/${memberId}`),
        status: 204,
      });
    });

    when('the client moves the member to a new wing and squad', async () => {
      result = await client.fleets.moveFleetMember(fleetId, memberId, moveBody);
    });

    then('the move operation shall complete without error', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('PUT');
      expect(request.url.pathname).toBe(
        `/fleets/${fleetId}/members/${memberId}/`,
      );
      expect(requestBody()).toEqual(moveBody);
      expect(result).toBeUndefined();
    });
  });

  test('Wings expose their nested squads', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const expectedWings = [
      {
        id: 2073711261968,
        name: 'DPS Wing',
        squads: [
          { id: 3129411261968, name: 'DPS Squad Alpha' },
          { id: 3129411261969, name: 'DPS Squad Bravo' },
        ],
      },
      {
        id: 2073711261969,
        name: 'Logi Wing',
        squads: [{ id: 3129411261970, name: 'Logi Squad' }],
      },
    ];

    given('an active fleet with wings', () => {
      queueResponse({
        match: esiPath(`fleets/${fleetId}/wings`),
        body: expectedWings,
      });
    });

    when('the client requests the fleet wings', async () => {
      result = await client.fleets.getFleetWings(fleetId);
    });

    then('the client shall return wings with nested squads', () => {
      expect(lastRequest().url.pathname).toBe(`/fleets/${fleetId}/wings/`);
      expect(result).toEqual(expectedWings);
      expect(
        result.map((w: any) => [w.id, w.name, w.squads.map((s: any) => s.id)]),
      ).toEqual([
        [2073711261968, 'DPS Wing', [3129411261968, 3129411261969]],
        [2073711261969, 'Logi Wing', [3129411261970]],
      ]);
    });
  });

  test('New wing returns the assigned wing ID', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const wingBody = { name: 'Tackle Wing' };

    given('a fleet commander for wing creation', () => {
      queueResponse({
        match: esiPath(`fleets/${fleetId}/wings`),
        status: 201,
        body: { wing_id: 2073711261970 },
      });
    });

    when('the client creates a new wing', async () => {
      result = await client.fleets.createFleetWing(fleetId, wingBody);
    });

    then('the client shall return the new wing ID', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe(`/fleets/${fleetId}/wings/`);
      expect(result).toEqual({ wing_id: 2073711261970 });
    });
  });

  test('New squad returns the assigned squad ID', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const wingId = 2073711261970;

    given('a fleet with a wing', () => {
      queueResponse({
        match: esiPath(`fleets/${fleetId}/wings/${wingId}/squads`),
        status: 201,
        body: { squad_id: 3129411261971 },
      });
    });

    when('the client creates a squad under that wing', async () => {
      result = await client.fleets.createFleetSquad(fleetId, wingId);
    });

    then('the client shall return the new squad ID', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe(
        `/fleets/${fleetId}/wings/${wingId}/squads/`,
      );
      expect(result).toEqual({ squad_id: 3129411261971 });
    });
  });

  test('Non-boss attempting to change fleet settings', ({
    given,
    when,
    then,
  }) => {
    const fleetId = 1234567890;
    let caughtError: any;

    given('a non-fleet-boss character', () => {
      queueError(403, 'Character is not the fleet boss', {
        match: esiPath(`fleets/${fleetId}`),
      });
    });

    when('the client attempts to modify fleet settings', async () => {
      try {
        await client.fleets.updateFleet(fleetId, { motd: 'Unauthorized' });
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 403 forbidden error for fleet', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('PUT');
      expect(requestBody()).toEqual({ motd: 'Unauthorized' });
    });
  });

  test('Details, members, and wings fetched in parallel', ({
    given,
    when,
    then,
  }) => {
    let fleet: any;
    let members: any;
    let wings: any;
    const fleetId = 1234567890;
    const mockFleet = {
      is_free_move: true,
      is_registered: false,
      is_voice_enabled: false,
      motd: 'Fleet operations in progress',
    };
    const mockMembers = [
      fleetMember({ character_id: 1689391488 }),
      fleetMember({ character_id: 123456789 }),
    ];
    const mockWings = [
      {
        id: 2073711261968,
        name: 'Wing 1',
        squads: [{ id: 3129411261968, name: 'Squad 1' }],
      },
    ];

    given('a valid fleet for concurrent fetch', () => {
      // Staggered delays make the responses settle out of request order.
      queueResponse({
        match: esiPath(`fleets/${fleetId}`),
        body: mockFleet,
        delayMs: 30,
      });
      queueResponse({
        match: esiPath(`fleets/${fleetId}/members`),
        body: mockMembers,
        delayMs: 15,
      });
      queueResponse({
        match: esiPath(`fleets/${fleetId}/wings`),
        body: mockWings,
      });
    });

    when(
      'the client fetches fleet details, members, and wings in parallel',
      async () => {
        [fleet, members, wings] = await Promise.all([
          client.fleets.getFleetInformation(fleetId),
          client.fleets.getFleetMembers(fleetId),
          client.fleets.getFleetWings(fleetId),
        ]);
      },
    );

    then('all three requests shall resolve successfully', () => {
      expect(
        sentRequests()
          .map((r) => r.url.pathname)
          .sort(),
      ).toEqual(
        [
          `/fleets/${fleetId}`,
          `/fleets/${fleetId}/members`,
          `/fleets/${fleetId}/wings/`,
        ].sort(),
      );
      expect(fleet).toEqual(mockFleet);
      expect(members).toEqual(mockMembers);
      expect(wings).toEqual(mockWings);
    });
  });
});
