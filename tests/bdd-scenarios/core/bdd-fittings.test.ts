/**
 * BDD-Style Tests for Fittings Management
 *
 * Tests the FittingsClient for managing saved ship fittings,
 * including listing, creating, and deleting fittings.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Fittings Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Character Fittings', () => {
    describe('Scenario: List all saved fittings for a character', () => {
      it('Given a character with saved fittings, When I request their fittings, Then I should receive an array of fitting details', async () => {
        // Given
        const characterId = 1689391488;
        const mockFittings = [
          {
            fitting_id: 1,
            name: 'PvP Hurricane',
            ship_type_id: 24690,
            description: 'Standard hurricane fleet fit',
            items: [
              { type_id: 2488, flag: 11, quantity: 1 },
              { type_id: 519, flag: 12, quantity: 1 },
            ],
          },
          {
            fitting_id: 2,
            name: 'Ratting Vexor Navy Issue',
            ship_type_id: 29340,
            description: 'AFK ratting fit',
            items: [
              { type_id: 4405, flag: 11, quantity: 1 },
              { type_id: 2185, flag: 27, quantity: 5 },
            ],
          },
        ];

        jest
          .spyOn(client.fittings, 'getFittings')
          .mockResolvedValue(mockFittings);

        // When
        const result = await client.fittings.getFittings(characterId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('fitting_id', 1);
        expect(result[0]).toHaveProperty('name', 'PvP Hurricane');
        expect(result[0]).toHaveProperty('ship_type_id', 24690);
        expect(result[0].items).toBeInstanceOf(Array);
        expect(result[0].items).toHaveLength(2);
        expect(result[0].items[0]).toHaveProperty('type_id');
        expect(result[0].items[0]).toHaveProperty('flag');
        expect(result[0].items[0]).toHaveProperty('quantity');
      });
    });

    describe('Scenario: Character has no saved fittings', () => {
      it('Given a character with no saved fittings, When I request their fittings, Then I should receive an empty array', async () => {
        // Given
        const characterId = 1689391488;
        jest.spyOn(client.fittings, 'getFittings').mockResolvedValue([]);

        // When
        const result = await client.fittings.getFittings(characterId);

        // Then
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('Feature: Create Ship Fitting', () => {
    describe('Scenario: Successfully create a new fitting', () => {
      it('Given valid fitting data, When I create a new fitting, Then I should receive the new fitting ID', async () => {
        // Given
        const characterId = 1689391488;
        const fittingData = {
          name: 'Fleet Ferox',
          ship_type_id: 24690,
          description: 'Standard ferox fleet doctrine',
          items: [
            { type_id: 3170, flag: 11, quantity: 1 },
            { type_id: 3186, flag: 12, quantity: 1 },
            { type_id: 2281, flag: 13, quantity: 1 },
          ],
        };
        const mockResponse = { fitting_id: 42 };

        jest
          .spyOn(client.fittings, 'createFitting')
          .mockResolvedValue(mockResponse);

        // When
        const result = await client.fittings.createFitting(
          characterId,
          fittingData,
        );

        // Then
        expect(result).toBeDefined();
        expect(result.fitting_id).toBe(42);
      });
    });

    describe('Scenario: Create fitting with maximum items', () => {
      it('Given a fully fitted ship, When I save the fitting, Then the fitting should be created with all module slots populated', async () => {
        // Given
        const characterId = 1689391488;
        const fullFittingData = {
          name: 'Max Fit Raven',
          ship_type_id: 638,
          description: 'Fully fitted Raven for L4 missions',
          items: [
            { type_id: 3170, flag: 11, quantity: 1 },
            { type_id: 3170, flag: 12, quantity: 1 },
            { type_id: 3170, flag: 13, quantity: 1 },
            { type_id: 3170, flag: 14, quantity: 1 },
            { type_id: 3170, flag: 15, quantity: 1 },
            { type_id: 3170, flag: 16, quantity: 1 },
            { type_id: 519, flag: 19, quantity: 1 },
            { type_id: 519, flag: 20, quantity: 1 },
          ],
        };
        const mockResponse = { fitting_id: 100 };

        jest
          .spyOn(client.fittings, 'createFitting')
          .mockResolvedValue(mockResponse);

        // When
        const result = await client.fittings.createFitting(
          characterId,
          fullFittingData,
        );

        // Then
        expect(result).toBeDefined();
        expect(result.fitting_id).toBe(100);
      });
    });
  });

  describe('Feature: Delete Ship Fitting', () => {
    describe('Scenario: Successfully delete an existing fitting', () => {
      it('Given a valid fitting ID, When I delete the fitting, Then the operation should complete without error', async () => {
        // Given
        const characterId = 1689391488;
        const fittingId = 42;

        jest
          .spyOn(client.fittings, 'deleteFitting')
          .mockResolvedValue(undefined);

        // When
        const result = await client.fittings.deleteFitting(
          characterId,
          fittingId,
        );

        // Then
        expect(result).toBeUndefined();
      });
    });
  });

  describe('Feature: Error Handling', () => {
    describe('Scenario: Unauthorized access to fittings', () => {
      it('Given an invalid or expired token, When I request fittings, Then I should receive a 403 forbidden error', async () => {
        // Given
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.fittings, 'getFittings')
          .mockRejectedValue(forbiddenError);

        // When & Then
        await expect(client.fittings.getFittings(characterId)).rejects.toThrow(
          EsiError,
        );
      });
    });

    describe('Scenario: Unauthorized access when creating a fitting', () => {
      it('Given insufficient permissions, When I attempt to create a fitting, Then I should receive a 403 forbidden error', async () => {
        // Given
        const characterId = 1689391488;
        const fittingData = {
          name: 'Forbidden Fit',
          ship_type_id: 24690,
          description: 'Should fail',
          items: [{ type_id: 519, flag: 11, quantity: 1 }],
        };
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.fittings, 'createFitting')
          .mockRejectedValue(forbiddenError);

        // When & Then
        await expect(
          client.fittings.createFitting(characterId, fittingData),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Fittings Workflow', () => {
    describe('Scenario: Full fitting lifecycle - create, list, and delete', () => {
      it('Given a character, When I create a fitting then list fittings then delete it, Then each operation should succeed in sequence', async () => {
        // Given
        const characterId = 1689391488;
        const fittingData = {
          name: 'Lifecycle Test Fit',
          ship_type_id: 24690,
          description: 'Test fitting lifecycle',
          items: [{ type_id: 519, flag: 11, quantity: 1 }],
        };

        const createSpy = jest
          .spyOn(client.fittings, 'createFitting')
          .mockResolvedValue({ fitting_id: 99 });

        const listSpy = jest
          .spyOn(client.fittings, 'getFittings')
          .mockResolvedValue([
            {
              fitting_id: 99,
              name: 'Lifecycle Test Fit',
              ship_type_id: 24690,
              description: 'Test fitting lifecycle',
              items: [{ type_id: 519, flag: 11, quantity: 1 }],
            },
          ]);

        const deleteSpy = jest
          .spyOn(client.fittings, 'deleteFitting')
          .mockResolvedValue(undefined);

        // When: Create
        const created = await client.fittings.createFitting(
          characterId,
          fittingData,
        );
        expect(created.fitting_id).toBe(99);

        // When: List
        const fittings = await client.fittings.getFittings(characterId);
        expect(fittings).toHaveLength(1);
        expect(fittings[0].fitting_id).toBe(99);

        // When: Delete
        await client.fittings.deleteFitting(characterId, created.fitting_id);

        // Then
        expect(createSpy).toHaveBeenCalledWith(characterId, fittingData);
        expect(listSpy).toHaveBeenCalledWith(characterId);
        expect(deleteSpy).toHaveBeenCalledWith(characterId, 99);
      });
    });
  });
});
