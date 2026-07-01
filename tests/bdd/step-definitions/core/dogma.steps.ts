import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/dogma.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN listing all dogma attribute IDs, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the dogma API is available', () => {
      const mockAttributes = [1, 2, 3, 4, 5];

      jest
        .spyOn(client.dogma, 'getAttributes')
        .mockResolvedValue(mockAttributes);
    });

    when('the client requests all attributes', async () => {
      result = await client.dogma.getAttributes();
    });

    then('the client shall return an array of attribute IDs', () => {
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((id: number) => {
        expect(typeof id).toBe('number');
      });
    });
  });

  test('WHEN getting a specific dogma attribute, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const attributeId = 20;

    given('a valid attribute ID', () => {
      const mockAttribute = {
        attribute_id: attributeId,
        name: 'powerOutput',
        description: 'The amount of power available.',
        published: true,
        display_name: 'Powergrid Output',
        high_is_good: true,
      };

      jest
        .spyOn(client.dogma, 'getAttributeById')
        .mockResolvedValue(mockAttribute);
    });

    when('the client requests attribute details', async () => {
      result = await client.dogma.getAttributeById(attributeId);
    });

    then('the client shall return complete attribute information', () => {
      expect(result).toBeDefined();
      expect(result.attribute_id).toBe(attributeId);
      expect(result.name).toBe('powerOutput');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('published');
    });
  });

  test('IF non-existent attribute, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const invalidId = 999999999;
    let caughtError: any;

    given('an invalid attribute ID', () => {
      const expectedError = TestDataFactory.createError(404);

      jest
        .spyOn(client.dogma, 'getAttributeById')
        .mockRejectedValue(expectedError);
    });

    when(
      'the client requests attribute details for the invalid ID',
      async () => {
        try {
          await client.dogma.getAttributeById(invalidId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then('the client shall return a not found error for the attribute', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
    });
  });

  test('WHEN listing all dogma effect IDs, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the dogma effects API is available', () => {
      const mockEffects = [11, 12, 13, 16, 18];

      jest.spyOn(client.dogma, 'getEffects').mockResolvedValue(mockEffects);
    });

    when('the client requests all effects', async () => {
      result = await client.dogma.getEffects();
    });

    then('the client shall return an array of effect IDs', () => {
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((id: number) => {
        expect(typeof id).toBe('number');
      });
    });
  });

  test('WHEN getting a specific dogma effect, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const effectId = 11;

    given('a valid effect ID', () => {
      const mockEffect = {
        effect_id: effectId,
        name: 'lowPower',
        description: 'Requires a low power slot.',
        published: true,
        display_name: 'Low Power',
        effect_category: 0,
        is_assistance: false,
        is_offensive: false,
        is_warp_safe: true,
      };

      jest.spyOn(client.dogma, 'getEffectById').mockResolvedValue(mockEffect);
    });

    when('the client requests effect details', async () => {
      result = await client.dogma.getEffectById(effectId);
    });

    then('the client shall return complete effect information', () => {
      expect(result).toBeDefined();
      expect(result.effect_id).toBe(effectId);
      expect(result.name).toBe('lowPower');
      expect(result).toHaveProperty('published');
      expect(result).toHaveProperty('is_warp_safe');
    });
  });

  test('IF non-existent effect, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const invalidId = 999999999;
    let caughtError: any;

    given('an invalid effect ID', () => {
      const expectedError = TestDataFactory.createError(404);

      jest
        .spyOn(client.dogma, 'getEffectById')
        .mockRejectedValue(expectedError);
    });

    when('the client requests effect details for the invalid ID', async () => {
      try {
        await client.dogma.getEffectById(invalidId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a not found error for the effect', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
    });
  });

  test('WHEN getting mutated item dogma info, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const typeId = 47740;
    const itemId = 1234567890;

    given('a mutated item exists', () => {
      const mockDynamicItem = {
        created_by: 2112625428,
        dogma_attributes: [
          { attribute_id: 9, value: 1.0 },
          { attribute_id: 20, value: 125.0 },
        ],
        dogma_effects: [
          { effect_id: 11, is_default: false },
          { effect_id: 12, is_default: true },
        ],
        mutator_type_id: 47842,
        source_type_id: 2048,
      };

      jest
        .spyOn(client.dogma, 'getDynamicItemInfo')
        .mockResolvedValue(mockDynamicItem);
    });

    when('the client requests its dynamic dogma info', async () => {
      result = await client.dogma.getDynamicItemInfo(typeId, itemId);
    });

    then('the client shall return modified attributes and effects', () => {
      expect(result).toBeDefined();
      expect(result.created_by).toBe(2112625428);
      expect(result.mutator_type_id).toBe(47842);
      expect(result.source_type_id).toBe(2048);
      expect(Array.isArray(result.dogma_attributes)).toBe(true);
      expect(result.dogma_attributes.length).toBeGreaterThan(0);
      expect(Array.isArray(result.dogma_effects)).toBe(true);
      expect(result.dogma_effects.length).toBeGreaterThan(0);
    });
  });

  test('IF non-existent dynamic item, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('an invalid type and item ID', () => {
      const expectedError = TestDataFactory.createError(404);

      jest
        .spyOn(client.dogma, 'getDynamicItemInfo')
        .mockRejectedValue(expectedError);
    });

    when('the client requests dynamic info for the invalid item', async () => {
      try {
        await client.dogma.getDynamicItemInfo(999999, 999999);
      } catch (error) {
        caughtError = error;
      }
    });

    then(
      'the client shall return a not found error for the dynamic item',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(404);
      },
    );
  });
});
