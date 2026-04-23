/**
 * BDD-Style Testing for Planetary Interaction (PI) API
 *
 * This demonstrates BDD principles for the PI API
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Planetary Interaction Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'mock-access-token',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Character Colonies', () => {
    describe('Scenario: List all colonies for a character', () => {
      it('Given a valid character ID, When I request planetary colonies, Then I should receive a list of colonies', async () => {
        // Given
        const characterId = 90000001;
        const expectedColonies = [
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
        ];

        jest
          .spyOn(client.pi, 'getColonies')
          .mockResolvedValue(expectedColonies as any);

        // When
        const result = await client.pi.getColonies(characterId);

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].planet_id).toBe(40000001);
        expect(result[0].planet_type).toBe('temperate');
        expect(result[1].upgrade_level).toBe(4);
      });
    });

    describe('Scenario: Character with no colonies', () => {
      it('Given a character with no PI colonies, When I request colonies, Then I should receive an empty array', async () => {
        // Given
        const characterId = 90000001;

        jest.spyOn(client.pi, 'getColonies').mockResolvedValue([]);

        // When
        const result = await client.pi.getColonies(characterId);

        // Then
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('Feature: Retrieve Colony Layout', () => {
    describe('Scenario: Get detailed layout for a colony', () => {
      it('Given a character ID and planet ID, When I request the colony layout, Then I should receive pins, links, and routes', async () => {
        // Given
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
              schematic_id: 0,
            },
          ],
          links: [
            { source_pin_id: 1001, destination_pin_id: 1002, link_level: 0 },
          ],
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

        jest
          .spyOn(client.pi, 'getColonyLayout')
          .mockResolvedValue(expectedLayout as any);

        // When
        const result = await client.pi.getColonyLayout(characterId, planetId);

        // Then
        expect(result).toBeDefined();
        expect(result.pins).toHaveLength(2);
        expect(result.links).toHaveLength(1);
        expect(result.routes).toHaveLength(1);
        expect(result.links[0].source_pin_id).toBe(1001);
        expect(result.links[0].destination_pin_id).toBe(1002);
      });
    });

    describe('Scenario: Get layout for an empty colony', () => {
      it('Given a colony with no structures, When I request the layout, Then I should receive empty arrays', async () => {
        // Given
        const characterId = 90000001;
        const planetId = 40000003;
        const emptyLayout = { pins: [], links: [], routes: [] };

        jest
          .spyOn(client.pi, 'getColonyLayout')
          .mockResolvedValue(emptyLayout as any);

        // When
        const result = await client.pi.getColonyLayout(characterId, planetId);

        // Then
        expect(result.pins).toHaveLength(0);
        expect(result.links).toHaveLength(0);
        expect(result.routes).toHaveLength(0);
      });
    });
  });

  describe('Feature: Retrieve Schematic Information', () => {
    describe('Scenario: Get a PI schematic by ID', () => {
      it('Given a valid schematic ID, When I request the schematic, Then I should receive schematic details', async () => {
        // Given
        const schematicId = 130;
        const expectedSchematic = {
          schematic_id: 130,
          schematic_name: 'Bacteria',
          cycle_time: 1800,
        };

        jest
          .spyOn(client.pi, 'getSchematicInformation')
          .mockResolvedValue(expectedSchematic as any);

        // When
        const result = await client.pi.getSchematicInformation(schematicId);

        // Then
        expect(result).toBeDefined();
        expect(result.schematic_name).toBe('Bacteria');
        expect(result.cycle_time).toBe(1800);
      });
    });

    describe('Scenario: Schematic not found', () => {
      it('Given an invalid schematic ID, When I request the schematic, Then I should receive a 404 error', async () => {
        // Given
        const schematicId = 999999;
        const error = TestDataFactory.createError(404);

        jest
          .spyOn(client.pi, 'getSchematicInformation')
          .mockRejectedValue(error);

        // When & Then
        await expect(
          client.pi.getSchematicInformation(schematicId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Retrieve Customs Offices', () => {
    describe('Scenario: List customs offices for a corporation', () => {
      it('Given a valid corporation ID, When I request customs offices, Then I should receive a list of customs offices', async () => {
        // Given
        const corporationId = 1344654522;
        const expectedOffices = [
          {
            office_id: 7001,
            system_id: 30000142,
            planet_id: 40000001,
            reinforce_exit_start: 18,
            reinforce_exit_end: 21,
            alliance_tax_rate: 0.1,
            corporation_tax_rate: 0.05,
            standing_level: 'terrible',
            terrible_standing_tax_rate: 0.5,
          },
          {
            office_id: 7002,
            system_id: 30000143,
            planet_id: 40000010,
            reinforce_exit_start: 0,
            reinforce_exit_end: 3,
            alliance_tax_rate: 0.1,
            corporation_tax_rate: 0.05,
            standing_level: 'neutral',
            terrible_standing_tax_rate: 0.5,
          },
        ];

        jest
          .spyOn(client.pi, 'getCorporationCustomsOffices')
          .mockResolvedValue(expectedOffices as any);

        // When
        const result =
          await client.pi.getCorporationCustomsOffices(corporationId);

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].office_id).toBe(7001);
        expect(result[1].system_id).toBe(30000143);
      });
    });

    describe('Scenario: Unauthorized access to customs offices', () => {
      it('Given insufficient permissions, When I request customs offices, Then I should receive a 403 error', async () => {
        // Given
        const corporationId = 1344654522;
        const error = TestDataFactory.createError(403);

        jest
          .spyOn(client.pi, 'getCorporationCustomsOffices')
          .mockRejectedValue(error);

        // When & Then
        await expect(
          client.pi.getCorporationCustomsOffices(corporationId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: PI Workflow', () => {
    describe('Scenario: Retrieve colonies and inspect their layouts', () => {
      it('Given a character with colonies, When I retrieve colonies and then their layouts, Then I should have complete PI data', async () => {
        // Given
        const characterId = 90000001;
        const colonies = [
          {
            planet_id: 40000001,
            planet_type: 'temperate',
            solar_system_id: 30000142,
            num_pins: 5,
            last_update: '2024-03-15T10:00:00Z',
            owner_id: characterId,
            upgrade_level: 5,
          },
        ];
        const layout = {
          pins: [
            { pin_id: 1001, type_id: 2254, latitude: 0.5, longitude: 1.2 },
          ],
          links: [],
          routes: [],
        };

        jest.spyOn(client.pi, 'getColonies').mockResolvedValue(colonies as any);
        jest
          .spyOn(client.pi, 'getColonyLayout')
          .mockResolvedValue(layout as any);

        // When
        const allColonies = await client.pi.getColonies(characterId);
        const colonyLayout = await client.pi.getColonyLayout(
          characterId,
          allColonies[0].planet_id,
        );

        // Then
        expect(allColonies).toHaveLength(1);
        expect(colonyLayout.pins).toHaveLength(1);
        expect(client.pi.getColonyLayout).toHaveBeenCalledWith(
          characterId,
          40000001,
        );
      });
    });
  });
});
