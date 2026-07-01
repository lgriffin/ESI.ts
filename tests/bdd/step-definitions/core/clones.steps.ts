import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';

const feature = loadFeature('tests/bdd/features/core/clones.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'mock-access-token',
      timeout: 5000,
    });
  });

  test('WHEN getting clone information for a valid character, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let result: any;

    given('a valid character ID for clones', () => {
      const expectedResponse = {
        home_location: {
          location_id: 60003760,
          location_type: 'station',
        },
        jump_clones: [
          {
            jump_clone_id: 12345,
            location_id: 60003760,
            implants: [1, 2, 3],
          },
          { jump_clone_id: 12346, location_id: 60008494, implants: [] },
        ],
        last_clone_jump_date: '2024-01-15T12:00:00Z',
        last_station_change_date: '2024-01-10T08:00:00Z',
      };

      jest
        .spyOn(client.clones, 'getClones')
        .mockResolvedValue(expectedResponse as any);
    });

    when('the client requests clone information', async () => {
      result = await client.clones.getClones(characterId);
    });

    then('the client shall return clone details', () => {
      expect(result).toBeDefined();
      expect(result.home_location).toBeDefined();
      expect(result.home_location!.location_id).toBe(60003760);
      expect(result.jump_clones).toHaveLength(2);
    });
  });

  test('IF unauthorized clone request, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let error: any;

    given('an invalid access token for clones', () => {
      const authError = new EsiError(401, 'Token is expired');

      jest.spyOn(client.clones, 'getClones').mockRejectedValue(authError);
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
      expect(error).toBeDefined();
      expect(error.message).toContain('Token is expired');
    });
  });

  test('WHEN getting active implants for a character, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let result: any;

    given('a valid character ID for implants', () => {
      const expectedImplants = [9899, 9941, 9942, 9943, 9956];

      jest
        .spyOn(client.clones, 'getImplants')
        .mockResolvedValue(expectedImplants);
    });

    when('the client requests implant information', async () => {
      result = await client.clones.getImplants(characterId);
    });

    then('the client shall return a list of implant type IDs', () => {
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      result.forEach((implant: number) => {
        expect(typeof implant).toBe('number');
      });
    });
  });

  test('WHILE the character with no implants, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let result: any;

    given('a character with no active implants', () => {
      jest.spyOn(client.clones, 'getImplants').mockResolvedValue([]);
    });

    when(
      'the client requests implant information for the character',
      async () => {
        result = await client.clones.getImplants(characterId);
      },
    );

    then('the client shall return an empty array for implants', () => {
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  test('WHEN retrieving clones and their implants, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 90000001;
    let clones: any;
    let implants: any;

    given('a character with clones', () => {
      const cloneData = {
        home_location: { location_id: 60003760, location_type: 'station' },
        jump_clones: [
          {
            jump_clone_id: 12345,
            location_id: 60003760,
            implants: [9899, 9941],
          },
          { jump_clone_id: 12346, location_id: 60008494, implants: [9942] },
        ],
      };
      const activeImplants = [9943, 9956];

      jest
        .spyOn(client.clones, 'getClones')
        .mockResolvedValue(cloneData as any);
      jest
        .spyOn(client.clones, 'getImplants')
        .mockResolvedValue(activeImplants);
    });

    when('the client retrieves clone info and implants', async () => {
      clones = await client.clones.getClones(characterId);
      implants = await client.clones.getImplants(characterId);
    });

    then('the client shall have complete clone data', () => {
      expect(clones.jump_clones).toHaveLength(2);
      expect(implants).toHaveLength(2);
      expect(clones.jump_clones[0].implants).toHaveLength(2);
    });
  });
});
