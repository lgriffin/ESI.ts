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

  test('WHEN getting character fleet info when in a fleet, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
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

    when('the client requests their fleet info', async () => {
      result = await client.fleets.getCharacterFleetInfo(characterId);
    });

    then('the client shall return their fleet assignment details', () => {
      expect(result).toBeDefined();
      expect(result.fleet_id).toBe(1234567890);
      expect(result.role).toBe('fleet_commander');
    });
  });

  test('WHILE the character is not in any fleet, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('a character that is not in a fleet', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest
        .spyOn(client.fleets, 'getCharacterFleetInfo')
        .mockRejectedValue(notFoundError);
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
    });
  });

  test('WHEN getting fleet information, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
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

    when('the client requests fleet details', async () => {
      result = await client.fleets.getFleetInformation(fleetId);
    });

    then('the client shall return the fleet MOTD, boss, and settings', () => {
      expect(result).toBeDefined();
      expect(result.fleet_id).toBe(fleetId);
      expect(result.motd).toBe('Form up on titan');
      expect(result.is_free_move).toBe(false);
      expect(result).toHaveProperty('fleet_boss_id');
    });
  });

  test('WHEN updating fleet settings, the client shall apply the changes', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const fleetId = 1234567890;

    given('a fleet boss', () => {
      jest.spyOn(client.fleets, 'updateFleet').mockResolvedValue(undefined);
    });

    when(
      'the client updates the fleet MOTD and free-move setting',
      async () => {
        const updateBody = {
          motd: 'Updated MOTD: Align to gate',
          is_free_move: true,
        };
        result = await client.fleets.updateFleet(fleetId, updateBody);
      },
    );

    then('the fleet update shall complete without error', () => {
      expect(result).toBeUndefined();
    });
  });

  test('WHEN listing all fleet members, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
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

    when('the client requests the member list', async () => {
      result = await client.fleets.getFleetMembers(fleetId);
    });

    then(
      'the client shall return member details including ships and roles',
      () => {
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('character_id');
        expect(result[0]).toHaveProperty('role');
        expect(result[0]).toHaveProperty('ship_type_id');
        expect(result[0]).toHaveProperty('solar_system_id');
      },
    );
  });

  test('WHEN kicking a member from the fleet, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const fleetId = 1234567890;
    const memberId = 123456789;

    given('a fleet commander for kicking', () => {
      jest.spyOn(client.fleets, 'kickFleetMember').mockResolvedValue(undefined);
    });

    when('the client kicks a member from the fleet', async () => {
      result = await client.fleets.kickFleetMember(fleetId, memberId);
    });

    then('the kick operation shall complete without error', () => {
      expect(result).toBeUndefined();
    });
  });

  test('WHEN moving a member to a different squad, the client shall complete the move', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const fleetId = 1234567890;
    const memberId = 123456789;

    given('a fleet commander and a member', () => {
      jest.spyOn(client.fleets, 'moveFleetMember').mockResolvedValue(undefined);
    });

    when('the client moves the member to a new wing and squad', async () => {
      const moveBody = {
        role: 'squad_member',
        wing_id: 987654321,
        squad_id: 123456789,
      };
      result = await client.fleets.moveFleetMember(fleetId, memberId, moveBody);
    });

    then('the move operation shall complete without error', () => {
      expect(result).toBeUndefined();
    });
  });

  test('WHEN getting fleet wings structure, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
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

    when('the client requests the fleet wings', async () => {
      result = await client.fleets.getFleetWings(fleetId);
    });

    then('the client shall return wings with nested squads', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('wing_id', 100);
      expect(result[0]).toHaveProperty('name', 'DPS Wing');
      expect(result[0].squads).toBeInstanceOf(Array);
      expect(result[0].squads).toHaveLength(2);
      expect(result[1].squads).toHaveLength(1);
    });
  });

  test('WHEN creating a new fleet wing, the client shall create the resource', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const fleetId = 1234567890;

    given('a fleet commander for wing creation', () => {
      jest
        .spyOn(client.fleets, 'createFleetWing')
        .mockResolvedValue({ wing_id: 555 });
    });

    when('the client creates a new wing', async () => {
      const wingBody = { name: 'Tackle Wing' };
      result = await client.fleets.createFleetWing(fleetId, wingBody);
    });

    then('the client shall return the new wing ID', () => {
      expect(result).toBeDefined();
      expect(result.wing_id).toBe(555);
    });
  });

  test('WHEN creating a new squad under a wing, the client shall create the resource', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const fleetId = 1234567890;
    const wingId = 555;

    given('a fleet with a wing', () => {
      jest
        .spyOn(client.fleets, 'createFleetSquad')
        .mockResolvedValue({ squad_id: 777 });
    });

    when('the client creates a squad under that wing', async () => {
      result = await client.fleets.createFleetSquad(fleetId, wingId);
    });

    then('the client shall return the new squad ID', () => {
      expect(result).toBeDefined();
      expect(result.squad_id).toBe(777);
    });
  });

  test('IF unauthorized fleet access, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const fleetId = 1234567890;
    let caughtError: any;

    given('a non-fleet-boss character', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.fleets, 'updateFleet')
        .mockRejectedValue(forbiddenError);
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
    });
  });

  test('The client shall fetch fleet info, members, and wings concurrently', ({
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
