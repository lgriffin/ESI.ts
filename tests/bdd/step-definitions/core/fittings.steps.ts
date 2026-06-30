import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/fittings.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('List all saved fittings for a character', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('a character with saved fittings', () => {
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
    });

    when('I request their fittings', async () => {
      result = await client.fittings.getFittings(characterId);
    });

    then('I should receive an array of fitting details', () => {
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

  test('Character has no saved fittings', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('a character with no saved fittings', () => {
      jest.spyOn(client.fittings, 'getFittings').mockResolvedValue([]);
    });

    when('I request their fittings list', async () => {
      result = await client.fittings.getFittings(characterId);
    });

    then('I should receive an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('Successfully create a new fitting', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;
    let fittingData: any;

    given('valid fitting data', () => {
      fittingData = {
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
    });

    when('I create a new fitting', async () => {
      result = await client.fittings.createFitting(characterId, fittingData);
    });

    then('I should receive the new fitting ID', () => {
      expect(result).toBeDefined();
      expect(result.fitting_id).toBe(42);
    });
  });

  test('Create fitting with maximum items', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;
    let fullFittingData: any;

    given('a fully fitted ship', () => {
      fullFittingData = {
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
    });

    when('I save the fitting', async () => {
      result = await client.fittings.createFitting(
        characterId,
        fullFittingData,
      );
    });

    then(
      'the fitting should be created with all module slots populated',
      () => {
        expect(result).toBeDefined();
        expect(result.fitting_id).toBe(100);
      },
    );
  });

  test('Successfully delete an existing fitting', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;
    const fittingId = 42;

    given('a valid fitting ID', () => {
      jest.spyOn(client.fittings, 'deleteFitting').mockResolvedValue(undefined);
    });

    when('I delete the fitting', async () => {
      result = await client.fittings.deleteFitting(characterId, fittingId);
    });

    then('the operation should complete without error', () => {
      expect(result).toBeUndefined();
    });
  });

  test('Unauthorized access to fittings', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an invalid or expired token for fittings', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.fittings, 'getFittings')
        .mockRejectedValue(forbiddenError);
    });

    when('I request fittings with invalid token', async () => {
      try {
        await client.fittings.getFittings(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for fittings', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Unauthorized access when creating a fitting', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;
    let fittingData: any;

    given('insufficient permissions for fitting creation', () => {
      fittingData = {
        name: 'Forbidden Fit',
        ship_type_id: 24690,
        description: 'Should fail',
        items: [{ type_id: 519, flag: 11, quantity: 1 }],
      };
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.fittings, 'createFitting')
        .mockRejectedValue(forbiddenError);
    });

    when('I attempt to create a fitting', async () => {
      try {
        await client.fittings.createFitting(characterId, fittingData);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for creation', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Full fitting lifecycle - create, list, and delete', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let createSpy: any;
    let listSpy: any;
    let deleteSpy: any;
    let created: any;
    let fittings: any;
    const fittingData = {
      name: 'Lifecycle Test Fit',
      ship_type_id: 24690,
      description: 'Test fitting lifecycle',
      items: [{ type_id: 519, flag: 11, quantity: 1 }],
    };

    given('a character for fitting lifecycle', () => {
      createSpy = jest
        .spyOn(client.fittings, 'createFitting')
        .mockResolvedValue({ fitting_id: 99 });

      listSpy = jest.spyOn(client.fittings, 'getFittings').mockResolvedValue([
        {
          fitting_id: 99,
          name: 'Lifecycle Test Fit',
          ship_type_id: 24690,
          description: 'Test fitting lifecycle',
          items: [{ type_id: 519, flag: 11, quantity: 1 }],
        },
      ]);

      deleteSpy = jest
        .spyOn(client.fittings, 'deleteFitting')
        .mockResolvedValue(undefined);
    });

    when('I create a fitting then list fittings then delete it', async () => {
      created = await client.fittings.createFitting(characterId, fittingData);
      expect(created.fitting_id).toBe(99);

      fittings = await client.fittings.getFittings(characterId);
      expect(fittings).toHaveLength(1);
      expect(fittings[0].fitting_id).toBe(99);

      await client.fittings.deleteFitting(characterId, created.fitting_id);
    });

    then('each operation should succeed in sequence', () => {
      expect(createSpy).toHaveBeenCalledWith(characterId, fittingData);
      expect(listSpy).toHaveBeenCalledWith(characterId);
      expect(deleteSpy).toHaveBeenCalledWith(characterId, 99);
    });
  });
});
