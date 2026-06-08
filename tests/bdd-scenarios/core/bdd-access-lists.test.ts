/**
 * BDD-Style Testing for Access Lists API
 *
 * This demonstrates BDD principles for the Access Lists API
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Access Lists Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      accessToken: 'test-token',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Access List Contents', () => {
    describe('Scenario: Get access list with mixed entity types', () => {
      it('Given an access list exists with characters, corporations, and alliances, When I request the list, Then I should receive all entries with their access types', async () => {
        // Given
        const expectedList = {
          access_list_id: 42,
          name: 'Station Docking ACL',
          entries: [
            {
              entity_id: 1689391488,
              entity_type: 'character',
              access_type: 'allowed',
            },
            {
              entity_id: 98000002,
              entity_type: 'corporation',
              access_type: 'allowed',
            },
            {
              entity_id: 99000001,
              entity_type: 'alliance',
              access_type: 'blocked',
            },
          ],
        };

        jest
          .spyOn(client.accessLists, 'getAccessList')
          .mockResolvedValue(expectedList as any);

        // When
        const result = await client.accessLists.getAccessList(42);

        // Then
        expect(result).toBeDefined();
        expect(result.access_list_id).toBe(42);
        expect(result.name).toBe('Station Docking ACL');
        expect(result.entries).toHaveLength(3);

        const allowed = result.entries.filter(
          (e: any) => e.access_type === 'allowed',
        );
        const blocked = result.entries.filter(
          (e: any) => e.access_type === 'blocked',
        );
        expect(allowed).toHaveLength(2);
        expect(blocked).toHaveLength(1);
      });
    });

    describe('Scenario: Access list with no entries', () => {
      it('Given an empty access list exists, When I request the list, Then I should receive the list with an empty entries array', async () => {
        // Given
        const emptyList = {
          access_list_id: 99,
          name: 'Empty ACL',
          entries: [],
        };

        jest
          .spyOn(client.accessLists, 'getAccessList')
          .mockResolvedValue(emptyList as any);

        // When
        const result = await client.accessLists.getAccessList(99);

        // Then
        expect(result).toBeDefined();
        expect(result.access_list_id).toBe(99);
        expect(result.entries).toHaveLength(0);
      });
    });
  });

  describe('Feature: Access List Error Handling', () => {
    describe('Scenario: Unauthorized access', () => {
      it('Given no valid token is provided, When I request an access list, Then I should receive a 401 error', async () => {
        // Given
        const error = TestDataFactory.createError(401);

        jest
          .spyOn(client.accessLists, 'getAccessList')
          .mockRejectedValue(error);

        // When & Then
        await expect(client.accessLists.getAccessList(42)).rejects.toThrow(
          EsiError,
        );
      });
    });

    describe('Scenario: Access list not found', () => {
      it('Given an access list does not exist, When I request it, Then I should receive a 404 error', async () => {
        // Given
        const error = TestDataFactory.createError(404);

        jest
          .spyOn(client.accessLists, 'getAccessList')
          .mockRejectedValue(error);

        // When & Then
        await expect(client.accessLists.getAccessList(999999)).rejects.toThrow(
          EsiError,
        );
      });
    });
  });
});
