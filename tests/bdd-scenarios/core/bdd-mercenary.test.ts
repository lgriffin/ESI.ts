/**
 * BDD-Style Testing for Mercenary API
 *
 * This demonstrates BDD principles for the Mercenary API
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Mercenary Operations', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Mercenary Dens', () => {
    describe('Scenario: Get mercenary dens with development data', () => {
      it('Given mercenary dens exist, When I request dens, Then I should receive development and anarchy parameters', async () => {
        // Given
        const expectedDens = [
          {
            den_id: 5001,
            system_id: 30000142,
            constellation_id: 20000125,
            region_id: 10000002,
            development_level: 3,
            anarchy_level: 2,
            active_operations: 1,
          },
          {
            den_id: 5002,
            system_id: 30004759,
            constellation_id: 20000690,
            region_id: 10000060,
            development_level: 5,
            anarchy_level: 4,
            active_operations: 3,
          },
        ];

        jest
          .spyOn(client.mercenary, 'getMercenaryDens')
          .mockResolvedValue(expectedDens as any);

        // When
        const result = await client.mercenary.getMercenaryDens();

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].den_id).toBe(5001);
        expect(result[0].development_level).toBe(3);
        expect(result[0].anarchy_level).toBe(2);
        expect(result[1].active_operations).toBe(3);
      });
    });

    describe('Scenario: No mercenary dens available', () => {
      it('Given no dens exist in the area, When I request dens, Then I should receive an empty array', async () => {
        // Given
        jest.spyOn(client.mercenary, 'getMercenaryDens').mockResolvedValue([]);

        // When
        const result = await client.mercenary.getMercenaryDens();

        // Then
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('Feature: Retrieve Mercenary Tactical Operations', () => {
    describe('Scenario: Get active MTOs spawned from dens', () => {
      it('Given MTOs are active, When I request operations, Then I should receive operation details with status', async () => {
        // Given
        const expectedOps = [
          {
            operation_id: 7001,
            den_id: 5001,
            system_id: 30000142,
            site_type: 'assault',
            status: 'active',
            started_at: '2026-05-20T10:00:00Z',
            expires_at: '2026-05-20T22:00:00Z',
          },
          {
            operation_id: 7002,
            den_id: 5002,
            system_id: 30004759,
            site_type: 'recon',
            status: 'spawning',
            started_at: '2026-05-20T14:00:00Z',
            expires_at: '2026-05-21T02:00:00Z',
          },
        ];

        jest
          .spyOn(client.mercenary, 'getMercenaryTacticalOperations')
          .mockResolvedValue(expectedOps as any);

        // When
        const result = await client.mercenary.getMercenaryTacticalOperations();

        // Then
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        expect(result[0].operation_id).toBe(7001);
        expect(result[0].status).toBe('active');
        expect(result[1].site_type).toBe('recon');
      });
    });
  });

  describe('Feature: Mercenary Workflow', () => {
    describe('Scenario: Cross-reference dens with their operations', () => {
      it('Given dens and MTOs exist, When I fetch both, Then I can correlate operations to their parent dens', async () => {
        // Given
        const dens = [
          {
            den_id: 5001,
            system_id: 30000142,
            constellation_id: 20000125,
            region_id: 10000002,
            development_level: 3,
            anarchy_level: 2,
            active_operations: 1,
          },
        ];
        const ops = [
          {
            operation_id: 7001,
            den_id: 5001,
            system_id: 30000142,
            site_type: 'assault',
            status: 'active',
            started_at: '2026-05-20T10:00:00Z',
            expires_at: '2026-05-20T22:00:00Z',
          },
        ];

        jest
          .spyOn(client.mercenary, 'getMercenaryDens')
          .mockResolvedValue(dens as any);
        jest
          .spyOn(client.mercenary, 'getMercenaryTacticalOperations')
          .mockResolvedValue(ops as any);

        // When
        const [denResults, opResults] = await Promise.all([
          client.mercenary.getMercenaryDens(),
          client.mercenary.getMercenaryTacticalOperations(),
        ]);

        // Then
        expect(denResults).toHaveLength(1);
        expect(opResults).toHaveLength(1);
        expect(opResults[0].den_id).toBe(denResults[0].den_id);
      });
    });
  });

  describe('Feature: Mercenary Error Handling', () => {
    describe('Scenario: Service unavailable error', () => {
      it('Given the ESI service is down, When I request mercenary data, Then I should receive a 503 error', async () => {
        // Given
        const error = TestDataFactory.createError(503);

        jest
          .spyOn(client.mercenary, 'getMercenaryDens')
          .mockRejectedValue(error);

        // When & Then
        await expect(client.mercenary.getMercenaryDens()).rejects.toThrow(
          EsiError,
        );
      });
    });
  });
});
