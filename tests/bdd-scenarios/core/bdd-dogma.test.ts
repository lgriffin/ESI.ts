import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD: Dogma System', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Browse Dogma Attributes', () => {
    describe('Scenario: List all dogma attribute IDs', () => {
      it('Given the dogma API, When I request all attributes, Then I should receive an array of attribute IDs', async () => {
        const mockAttributes = [1, 2, 3, 4, 5];

        jest
          .spyOn(client.dogma, 'getAttributes')
          .mockResolvedValue(mockAttributes);

        const result = await client.dogma.getAttributes();

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        result.forEach((id) => {
          expect(typeof id).toBe('number');
        });
      });
    });

    describe('Scenario: Get a specific dogma attribute', () => {
      it('Given a valid attribute ID, When I request attribute details, Then I should receive complete attribute information', async () => {
        const attributeId = 20;
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

        const result = await client.dogma.getAttributeById(attributeId);

        expect(result).toBeDefined();
        expect(result.attribute_id).toBe(attributeId);
        expect(result.name).toBe('powerOutput');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('published');
      });
    });

    describe('Scenario: Handle non-existent attribute', () => {
      it('Given an invalid attribute ID, When I request attribute details, Then I should receive a not found error', async () => {
        const invalidId = 999999999;
        const expectedError = TestDataFactory.createError(404);

        jest
          .spyOn(client.dogma, 'getAttributeById')
          .mockRejectedValue(expectedError);

        try {
          await client.dogma.getAttributeById(invalidId);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(EsiError);
          expect((error as EsiError).statusCode).toBe(404);
        }
      });
    });
  });

  describe('Feature: Browse Dogma Effects', () => {
    describe('Scenario: List all dogma effect IDs', () => {
      it('Given the dogma API, When I request all effects, Then I should receive an array of effect IDs', async () => {
        const mockEffects = [11, 12, 13, 16, 18];

        jest.spyOn(client.dogma, 'getEffects').mockResolvedValue(mockEffects);

        const result = await client.dogma.getEffects();

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        result.forEach((id) => {
          expect(typeof id).toBe('number');
        });
      });
    });

    describe('Scenario: Get a specific dogma effect', () => {
      it('Given a valid effect ID, When I request effect details, Then I should receive complete effect information', async () => {
        const effectId = 11;
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

        const result = await client.dogma.getEffectById(effectId);

        expect(result).toBeDefined();
        expect(result.effect_id).toBe(effectId);
        expect(result.name).toBe('lowPower');
        expect(result).toHaveProperty('published');
        expect(result).toHaveProperty('is_warp_safe');
      });
    });

    describe('Scenario: Handle non-existent effect', () => {
      it('Given an invalid effect ID, When I request effect details, Then I should receive a not found error', async () => {
        const invalidId = 999999999;
        const expectedError = TestDataFactory.createError(404);

        jest
          .spyOn(client.dogma, 'getEffectById')
          .mockRejectedValue(expectedError);

        try {
          await client.dogma.getEffectById(invalidId);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(EsiError);
          expect((error as EsiError).statusCode).toBe(404);
        }
      });
    });
  });

  describe('Feature: Inspect Dynamic Item Dogma', () => {
    describe('Scenario: Get mutated item dogma info', () => {
      it('Given a mutated item, When I request its dynamic dogma info, Then I should receive modified attributes and effects', async () => {
        const typeId = 47740;
        const itemId = 1234567890;
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

        const result = await client.dogma.getDynamicItemInfo(typeId, itemId);

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

    describe('Scenario: Handle non-existent dynamic item', () => {
      it('Given an invalid type/item ID, When I request dynamic info, Then I should receive a not found error', async () => {
        const expectedError = TestDataFactory.createError(404);

        jest
          .spyOn(client.dogma, 'getDynamicItemInfo')
          .mockRejectedValue(expectedError);

        try {
          await client.dogma.getDynamicItemInfo(999999, 999999);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(EsiError);
          expect((error as EsiError).statusCode).toBe(404);
        }
      });
    });
  });
});
