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

const feature = loadFeature('tests/bdd/features/core/0007-clones.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Clone record with a home station and two jump clones', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let result: any;

    given('a valid character ID for clones', () => {
      queueResponse({
        match: `/characters/${characterId}/clones`,
        body: {
          home_location: {
            location_id: 60003760,
            location_type: 'station',
          },
          jump_clones: [
            {
              jump_clone_id: 12345,
              location_id: 60003760,
              location_type: 'station',
              implants: [9899, 9941, 9942],
            },
            {
              jump_clone_id: 12346,
              location_id: 1035466617946,
              location_type: 'structure',
              implants: [],
              name: 'Staging',
            },
          ],
          last_clone_jump_date: '2024-01-15T12:00:00Z',
          last_station_change_date: '2024-01-10T08:00:00Z',
        },
      });
    });

    when('the client requests clone information', async () => {
      result = await client.clones.getClones(characterId);
    });

    then('the client shall return clone details', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe(`/characters/${characterId}/clones`);
      expect(request.headers['authorization']).toBe('Bearer bdd-access-token');
      expect(result.home_location).toEqual({
        location_id: 60003760,
        location_type: 'station',
      });
      expect(result.jump_clones.map((c: any) => c.jump_clone_id)).toEqual([
        12345, 12346,
      ]);
      expect(result.jump_clones[0].implants).toEqual([9899, 9941, 9942]);
      expect(result.jump_clones[1]).toEqual({
        jump_clone_id: 12346,
        location_id: 1035466617946,
        location_type: 'structure',
        implants: [],
        name: 'Staging',
      });
    });
  });

  test('Expired token rejects with the reason reported by ESI', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let error: any;

    given('an invalid access token for clones', () => {
      // 403 is not retryable, so ESI answers exactly once.
      queueError(403, 'token is expired', {
        match: `/characters/${characterId}/clones`,
      });
    });

    when(
      'the client requests clone information without authorization',
      async () => {
        try {
          await client.clones.getClones(characterId);
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return an authentication error for clones', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(403);
      expect(error.message).toContain('token is expired');
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Implant list for a character wearing five implants', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let result: any;

    given('a valid character ID for implants', () => {
      queueResponse({
        match: `/characters/${characterId}/implants`,
        body: [9899, 9941, 9942, 9943, 9956],
      });
    });

    when('the client requests implant information', async () => {
      result = await client.clones.getImplants(characterId);
    });

    then('the client shall return a list of implant type IDs', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/implants`,
      );
      expect(result).toEqual([9899, 9941, 9942, 9943, 9956]);
    });
  });

  test('Character wearing no implants', ({ given, when, then }) => {
    const characterId = 90000001;
    let result: any;

    given('a character with no active implants', () => {
      queueResponse({
        match: `/characters/${characterId}/implants`,
        body: [],
      });
    });

    when(
      'the client requests implant information for the character',
      async () => {
        result = await client.clones.getImplants(characterId);
      },
    );

    then('the client shall return an empty array for implants', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual([]);
    });
  });

  test('Jump clone implants read alongside the active implant set', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let clones: any;
    let implants: any;

    given('a character with clones', () => {
      queueResponse({
        match: `/characters/${characterId}/clones`,
        body: {
          home_location: { location_id: 60003760, location_type: 'station' },
          jump_clones: [
            {
              jump_clone_id: 12345,
              location_id: 60003760,
              location_type: 'station',
              implants: [9899, 9941],
            },
            {
              jump_clone_id: 12346,
              location_id: 60008494,
              location_type: 'station',
              implants: [9942],
            },
          ],
        },
      });
      queueResponse({
        match: `/characters/${characterId}/implants`,
        body: [9943, 9956],
      });
    });

    when('the client retrieves clone info and implants', async () => {
      clones = await client.clones.getClones(characterId);
      implants = await client.clones.getImplants(characterId);
    });

    then('the client shall have complete clone data', () => {
      expect(sentRequests().map((r) => r.url.pathname)).toEqual([
        `/characters/${characterId}/clones`,
        `/characters/${characterId}/implants`,
      ]);
      expect(clones.jump_clones.map((c: any) => c.implants)).toEqual([
        [9899, 9941],
        [9942],
      ]);
      expect(implants).toEqual([9943, 9956]);
    });
  });
});
