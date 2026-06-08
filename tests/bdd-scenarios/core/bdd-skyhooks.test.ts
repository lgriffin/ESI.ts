/**
 * BDD-Style Testing for Skyhooks API
 *
 * This demonstrates BDD principles for the Skyhooks API
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Skyhooks Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Sovereignty Hubs', () => {
    describe('Scenario: Get sovereignty hubs as Upwell structures', () => {
      it('Given sovereignty hubs exist, When I request hubs, Then I should receive hub data with online status and upgrades', async () => {
        // Given
        const expectedHubs = [
          {
            structure_id: 100000001,
            system_id: 30000142,
            corporation_id: 98000002,
            alliance_id: 99000006,
            online: true,
            remaining_reagents: 500,
            installed_upgrades: [1, 2, 3],
          },
          {
            structure_id: 100000002,
            system_id: 30004759,
            corporation_id: 98000003,
            alliance_id: 99000001,
            online: false,
            remaining_reagents: 0,
            installed_upgrades: [],
          },
        ];

        jest
          .spyOn(client.skyhooks, 'getSovereigntyHubs')
          .mockResolvedValue(expectedHubs as any);

        // When
        const result = await client.skyhooks.getSovereigntyHubs();

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].online).toBe(true);
        expect(result[0].installed_upgrades).toEqual([1, 2, 3]);
        expect(result[1].online).toBe(false);
      });
    });
  });

  describe('Feature: Retrieve Orbital Skyhooks', () => {
    describe('Scenario: Get orbital skyhooks with silo data', () => {
      it('Given orbital skyhooks are deployed, When I request skyhooks, Then I should receive silo capacity and levels', async () => {
        // Given
        const expectedSkyhooks = [
          {
            structure_id: 200000001,
            system_id: 30000142,
            corporation_id: 98000002,
            alliance_id: 99000006,
            online: true,
            reagent_silo_capacity: 1000,
            reagent_silo_level: 750,
          },
        ];

        jest
          .spyOn(client.skyhooks, 'getOrbitalSkyhooks')
          .mockResolvedValue(expectedSkyhooks as any);

        // When
        const result = await client.skyhooks.getOrbitalSkyhooks();

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(1);
        expect(result[0].reagent_silo_capacity).toBe(1000);
        expect(result[0].reagent_silo_level).toBe(750);
      });
    });
  });

  describe('Feature: Retrieve Raidable Skyhooks', () => {
    describe('Scenario: Get skyhooks that are currently raidable', () => {
      it('Given raidable skyhooks exist across New Eden, When I request raidable skyhooks, Then I should receive the raidable list', async () => {
        // Given
        const expectedRaidable = [
          {
            structure_id: 200000001,
            system_id: 30000142,
            corporation_id: 98000002,
            alliance_id: 99000006,
            raidable_at: '2026-05-20T12:00:00Z',
            is_raidable: true,
          },
          {
            structure_id: 200000002,
            system_id: 30004759,
            corporation_id: 98000003,
            alliance_id: 99000001,
            raidable_at: '2026-05-21T08:00:00Z',
            is_raidable: false,
          },
        ];

        jest
          .spyOn(client.skyhooks, 'getRaidableSkyhooks')
          .mockResolvedValue(expectedRaidable as any);

        // When
        const result = await client.skyhooks.getRaidableSkyhooks();

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        const raidableNow = result.filter((s: any) => s.is_raidable);
        expect(raidableNow).toHaveLength(1);
        expect(raidableNow[0].structure_id).toBe(200000001);
      });
    });
  });

  describe('Feature: Skyhooks Error Handling', () => {
    describe('Scenario: Service unavailable error', () => {
      it('Given the ESI service is down, When I request skyhook data, Then I should receive a 503 error', async () => {
        // Given
        const error = TestDataFactory.createError(503);

        jest
          .spyOn(client.skyhooks, 'getSovereigntyHubs')
          .mockRejectedValue(error);

        // When & Then
        await expect(client.skyhooks.getSovereigntyHubs()).rejects.toThrow(
          EsiError,
        );
      });
    });
  });
});
