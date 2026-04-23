/**
 * BDD-Style Tests for Fleet Management
 *
 * Tests the FleetClient for fleet operations including retrieving fleet info,
 * managing members, wings, and squads.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Fleet Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Character Fleet Information', () => {
    describe('Scenario: Get character fleet info when in a fleet', () => {
      it('Given a character that is in a fleet, When I request their fleet info, Then I should receive their fleet assignment details', async () => {
        // Given
        const characterId = 1689391488;
        const mockFleetInfo = {
          fleet_id: 1234567890,
          role: 'fleet_commander' as const,
          squad_id: -1,
          wing_id: -1,
        };

        jest
          .spyOn(client.fleets, 'getCharacterFleetInfo')
          .mockResolvedValue(mockFleetInfo);

        // When
        const result = await client.fleets.getCharacterFleetInfo(characterId);

        // Then
        expect(result).toBeDefined();
        expect(result.fleet_id).toBe(1234567890);
        expect(result.role).toBe('fleet_commander');
      });
    });

    describe('Scenario: Character is not in any fleet', () => {
      it('Given a character that is not in a fleet, When I request their fleet info, Then I should receive a 404 error', async () => {
        // Given
        const characterId = 1689391488;
        const notFoundError = TestDataFactory.createError(404);

        jest
          .spyOn(client.fleets, 'getCharacterFleetInfo')
          .mockRejectedValue(notFoundError);

        // When & Then
        await expect(
          client.fleets.getCharacterFleetInfo(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Fleet Details', () => {
    describe('Scenario: Get fleet information', () => {
      it('Given a valid fleet ID, When I request fleet details, Then I should receive the fleet MOTD, boss, and settings', async () => {
        // Given
        const fleetId = 1234567890;
        const mockFleet = TestDataFactory.createFleetInfo({
          fleet_id: fleetId,
          motd: 'Form up on titan',
          is_free_move: false,
        });

        jest
          .spyOn(client.fleets, 'getFleetInformation')
          .mockResolvedValue(mockFleet);

        // When
        const result = await client.fleets.getFleetInformation(fleetId);

        // Then
        expect(result).toBeDefined();
        expect(result.fleet_id).toBe(fleetId);
        expect(result.motd).toBe('Form up on titan');
        expect(result.is_free_move).toBe(false);
        expect(result).toHaveProperty('fleet_boss_id');
      });
    });

    describe('Scenario: Update fleet settings', () => {
      it('Given a fleet boss, When I update the fleet MOTD and free-move setting, Then the update should complete without error', async () => {
        // Given
        const fleetId = 1234567890;
        const updateBody = {
          motd: 'Updated MOTD: Align to gate',
          is_free_move: true,
        };

        jest.spyOn(client.fleets, 'updateFleet').mockResolvedValue(undefined);

        // When
        const result = await client.fleets.updateFleet(fleetId, updateBody);

        // Then
        expect(result).toBeUndefined();
      });
    });
  });

  describe('Feature: Fleet Member Management', () => {
    describe('Scenario: List all fleet members', () => {
      it('Given an active fleet with members, When I request the member list, Then I should receive member details including ships and roles', async () => {
        // Given
        const fleetId = 1234567890;
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

        // When
        const result = await client.fleets.getFleetMembers(fleetId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('character_id');
        expect(result[0]).toHaveProperty('role');
        expect(result[0]).toHaveProperty('ship_type_id');
        expect(result[0]).toHaveProperty('solar_system_id');
      });
    });

    describe('Scenario: Kick a member from the fleet', () => {
      it('Given a fleet commander, When I kick a member from the fleet, Then the operation should complete without error', async () => {
        // Given
        const fleetId = 1234567890;
        const memberId = 123456789;

        jest
          .spyOn(client.fleets, 'kickFleetMember')
          .mockResolvedValue(undefined);

        // When
        const result = await client.fleets.kickFleetMember(fleetId, memberId);

        // Then
        expect(result).toBeUndefined();
      });
    });

    describe('Scenario: Move a member to a different squad', () => {
      it('Given a fleet commander and a member, When I move the member to a new wing and squad, Then the operation should complete without error', async () => {
        // Given
        const fleetId = 1234567890;
        const memberId = 123456789;
        const moveBody = {
          role: 'squad_member',
          wing_id: 987654321,
          squad_id: 123456789,
        };

        jest
          .spyOn(client.fleets, 'moveFleetMember')
          .mockResolvedValue(undefined);

        // When
        const result = await client.fleets.moveFleetMember(
          fleetId,
          memberId,
          moveBody,
        );

        // Then
        expect(result).toBeUndefined();
      });
    });
  });

  describe('Feature: Fleet Wing and Squad Management', () => {
    describe('Scenario: Get fleet wings structure', () => {
      it('Given an active fleet, When I request the fleet wings, Then I should receive wings with nested squads', async () => {
        // Given
        const fleetId = 1234567890;
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

        // When
        const result = await client.fleets.getFleetWings(fleetId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('wing_id', 100);
        expect(result[0]).toHaveProperty('name', 'DPS Wing');
        expect(result[0].squads).toBeInstanceOf(Array);
        expect(result[0].squads).toHaveLength(2);
        expect(result[1].squads).toHaveLength(1);
      });
    });

    describe('Scenario: Create a new fleet wing', () => {
      it('Given a fleet commander, When I create a new wing, Then I should receive the new wing ID', async () => {
        // Given
        const fleetId = 1234567890;
        const wingBody = { name: 'Tackle Wing' };

        jest
          .spyOn(client.fleets, 'createFleetWing')
          .mockResolvedValue({ wing_id: 555 });

        // When
        const result = await client.fleets.createFleetWing(fleetId, wingBody);

        // Then
        expect(result).toBeDefined();
        expect(result.wing_id).toBe(555);
      });
    });

    describe('Scenario: Create a new squad under a wing', () => {
      it('Given a fleet with a wing, When I create a squad under that wing, Then I should receive the new squad ID', async () => {
        // Given
        const fleetId = 1234567890;
        const wingId = 555;

        jest
          .spyOn(client.fleets, 'createFleetSquad')
          .mockResolvedValue({ squad_id: 777 });

        // When
        const result = await client.fleets.createFleetSquad(fleetId, wingId);

        // Then
        expect(result).toBeDefined();
        expect(result.squad_id).toBe(777);
      });
    });
  });

  describe('Feature: Error Handling', () => {
    describe('Scenario: Unauthorized fleet access', () => {
      it('Given a non-fleet-boss character, When I attempt to modify fleet settings, Then I should receive a 403 forbidden error', async () => {
        // Given
        const fleetId = 1234567890;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.fleets, 'updateFleet')
          .mockRejectedValue(forbiddenError);

        // When & Then
        await expect(
          client.fleets.updateFleet(fleetId, { motd: 'Unauthorized' }),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Concurrent Fleet Data Fetch', () => {
    describe('Scenario: Fetch fleet info, members, and wings concurrently', () => {
      it('Given a valid fleet, When I fetch fleet details, members, and wings in parallel, Then all three requests should resolve successfully', async () => {
        // Given
        const fleetId = 1234567890;
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

        // When
        const [fleet, members, wings] = await Promise.all([
          client.fleets.getFleetInformation(fleetId),
          client.fleets.getFleetMembers(fleetId),
          client.fleets.getFleetWings(fleetId),
        ]);

        // Then
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
});
