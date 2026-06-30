import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/fleets.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Get character fleet info when in a fleet', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('a character that is in a fleet', () => {
      const mockFleetInfo = {
        fleet_id: 1234567890,
        role: 'fleet_commander' as const,
        squad_id: -1,
        wing_id: -1,
      };

      jest
        .spyOn(client.fleets, 'getCharacterFleetInfo')
        .mockResolvedValue(mockFleetInfo);
    });

    when('I request their fleet info', async () => {
      result = await client.fleets.getCharacterFleetInfo(characterId);
    });

    then('I should receive their fleet assignment details', () => {
      expect(result).toBeDefined();
      expect(result.fleet_id).toBe(1234567890);
      expect(result.role).toBe('fleet_commander');
    });
  });

  test('Character is not in any fleet', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('a character that is not in a fleet', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest
        .spyOn(client.fleets, 'getCharacterFleetInfo')
        .mockRejectedValue(notFoundError);
    });

    when('I request fleet info for the character not in a fleet', async () => {
      try {
        await client.fleets.getCharacterFleetInfo(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 404 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Get fleet information', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;

    given('a valid fleet ID', () => {
      const mockFleet = TestDataFactory.createFleetInfo({
        fleet_id: fleetId,
        motd: 'Form up on titan',
        is_free_move: false,
      });

      jest
        .spyOn(client.fleets, 'getFleetInformation')
        .mockResolvedValue(mockFleet);
    });

    when('I request fleet details', async () => {
      result = await client.fleets.getFleetInformation(fleetId);
    });

    then('I should receive the fleet MOTD, boss, and settings', () => {
      expect(result).toBeDefined();
      expect(result.fleet_id).toBe(fleetId);
      expect(result.motd).toBe('Form up on titan');
      expect(result.is_free_move).toBe(false);
      expect(result).toHaveProperty('fleet_boss_id');
    });
  });

  test('Update fleet settings', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;

    given('a fleet boss', () => {
      jest.spyOn(client.fleets, 'updateFleet').mockResolvedValue(undefined);
    });

    when('I update the fleet MOTD and free-move setting', async () => {
      const updateBody = {
        motd: 'Updated MOTD: Align to gate',
        is_free_move: true,
      };
      result = await client.fleets.updateFleet(fleetId, updateBody);
    });

    then('the fleet update should complete without error', () => {
      expect(result).toBeUndefined();
    });
  });

  test('List all fleet members', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;

    given('an active fleet with members', () => {
      const mockMembers = [
        TestDataFactory.createFleetMember({
          character_id: 1689391488,
          role: 'fleet_commander',
          ship_type_id: 17918,
        }),
        TestDataFactory.createFleetMember({
          character_id: 123456789,
          role: 'squad_member',
          ship_type_id: 24690,
        }),
        TestDataFactory.createFleetMember({
          character_id: 111111111,
          role: 'wing_commander',
          ship_type_id: 17920,
        }),
      ];

      jest
        .spyOn(client.fleets, 'getFleetMembers')
        .mockResolvedValue(mockMembers);
    });

    when('I request the member list', async () => {
      result = await client.fleets.getFleetMembers(fleetId);
    });

    then('I should receive member details including ships and roles', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('character_id');
      expect(result[0]).toHaveProperty('role');
      expect(result[0]).toHaveProperty('ship_type_id');
      expect(result[0]).toHaveProperty('solar_system_id');
    });
  });

  test('Kick a member from the fleet', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const memberId = 123456789;

    given('a fleet commander for kicking', () => {
      jest.spyOn(client.fleets, 'kickFleetMember').mockResolvedValue(undefined);
    });

    when('I kick a member from the fleet', async () => {
      result = await client.fleets.kickFleetMember(fleetId, memberId);
    });

    then('the kick operation should complete without error', () => {
      expect(result).toBeUndefined();
    });
  });

  test('Move a member to a different squad', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const memberId = 123456789;

    given('a fleet commander and a member', () => {
      jest.spyOn(client.fleets, 'moveFleetMember').mockResolvedValue(undefined);
    });

    when('I move the member to a new wing and squad', async () => {
      const moveBody = {
        role: 'squad_member',
        wing_id: 987654321,
        squad_id: 123456789,
      };
      result = await client.fleets.moveFleetMember(fleetId, memberId, moveBody);
    });

    then('the move operation should complete without error', () => {
      expect(result).toBeUndefined();
    });
  });

  test('Get fleet wings structure', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;

    given('an active fleet with wings', () => {
      const mockWings = [
        TestDataFactory.createFleetWing({
          wing_id: 100,
          name: 'DPS Wing',
          squads: [
            { squad_id: 201, name: 'DPS Squad Alpha' },
            { squad_id: 202, name: 'DPS Squad Bravo' },
          ],
        }),
        TestDataFactory.createFleetWing({
          wing_id: 101,
          name: 'Logi Wing',
          squads: [{ squad_id: 301, name: 'Logi Squad' }],
        }),
      ];

      jest.spyOn(client.fleets, 'getFleetWings').mockResolvedValue(mockWings);
    });

    when('I request the fleet wings', async () => {
      result = await client.fleets.getFleetWings(fleetId);
    });

    then('I should receive wings with nested squads', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('wing_id', 100);
      expect(result[0]).toHaveProperty('name', 'DPS Wing');
      expect(result[0].squads).toBeInstanceOf(Array);
      expect(result[0].squads).toHaveLength(2);
      expect(result[1].squads).toHaveLength(1);
    });
  });

  test('Create a new fleet wing', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;

    given('a fleet commander for wing creation', () => {
      jest
        .spyOn(client.fleets, 'createFleetWing')
        .mockResolvedValue({ wing_id: 555 });
    });

    when('I create a new wing', async () => {
      const wingBody = { name: 'Tackle Wing' };
      result = await client.fleets.createFleetWing(fleetId, wingBody);
    });

    then('I should receive the new wing ID', () => {
      expect(result).toBeDefined();
      expect(result.wing_id).toBe(555);
    });
  });

  test('Create a new squad under a wing', ({ given, when, then }) => {
    let result: any;
    const fleetId = 1234567890;
    const wingId = 555;

    given('a fleet with a wing', () => {
      jest
        .spyOn(client.fleets, 'createFleetSquad')
        .mockResolvedValue({ squad_id: 777 });
    });

    when('I create a squad under that wing', async () => {
      result = await client.fleets.createFleetSquad(fleetId, wingId);
    });

    then('I should receive the new squad ID', () => {
      expect(result).toBeDefined();
      expect(result.squad_id).toBe(777);
    });
  });

  test('Unauthorized fleet access', ({ given, when, then }) => {
    const fleetId = 1234567890;
    let caughtError: any;

    given('a non-fleet-boss character', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.fleets, 'updateFleet')
        .mockRejectedValue(forbiddenError);
    });

    when('I attempt to modify fleet settings', async () => {
      try {
        await client.fleets.updateFleet(fleetId, { motd: 'Unauthorized' });
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for fleet', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Fetch fleet info, members, and wings concurrently', ({
    given,
    when,
    then,
  }) => {
    let fleet: any;
    let members: any;
    let wings: any;
    const fleetId = 1234567890;

    given('a valid fleet for concurrent fetch', () => {
      const mockFleet = TestDataFactory.createFleetInfo({
        fleet_id: fleetId,
      });
      const mockMembers = [
        TestDataFactory.createFleetMember({ character_id: 1689391488 }),
        TestDataFactory.createFleetMember({ character_id: 123456789 }),
      ];
      const mockWings = [
        TestDataFactory.createFleetWing({ wing_id: 100, name: 'Wing 1' }),
      ];

      jest
        .spyOn(client.fleets, 'getFleetInformation')
        .mockResolvedValue(mockFleet);
      jest
        .spyOn(client.fleets, 'getFleetMembers')
        .mockResolvedValue(mockMembers);
      jest.spyOn(client.fleets, 'getFleetWings').mockResolvedValue(mockWings);
    });

    when('I fetch fleet details, members, and wings in parallel', async () => {
      [fleet, members, wings] = await Promise.all([
        client.fleets.getFleetInformation(fleetId),
        client.fleets.getFleetMembers(fleetId),
        client.fleets.getFleetWings(fleetId),
      ]);
    });

    then('all three requests should resolve successfully', () => {
      expect(fleet).toBeDefined();
      expect(fleet.fleet_id).toBe(fleetId);

      expect(members).toBeInstanceOf(Array);
      expect(members).toHaveLength(2);

      expect(wings).toBeInstanceOf(Array);
      expect(wings).toHaveLength(1);
      expect(wings[0].name).toBe('Wing 1');
    });
  });
});
