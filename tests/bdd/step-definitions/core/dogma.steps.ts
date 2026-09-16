import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0011-dogma.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Attribute index returns numeric IDs', ({ given, when, then }) => {
    const attributeIds = [2, 3, 4, 9, 20];
    let result: any;

    given('the dogma API is available', () => {
      queueResponse({ match: /\/dogma\/attributes\/?$/, body: attributeIds });
    });

    when('the client requests all attributes', async () => {
      result = await client.dogma.getAttributes();
    });

    then('the client shall return an array of attribute IDs', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toMatch(/\/dogma\/attributes\/?$/);
      expect(result).toEqual(attributeIds);
      result.forEach((id: unknown) => {
        expect(typeof id).toBe('number');
      });
    });
  });

  test('Attribute 20 resolves to the powerOutput record', ({
    given,
    when,
    then,
  }) => {
    const attributeId = 20;
    let result: any;

    given('a valid attribute ID', () => {
      queueResponse({
        match: `/dogma/attributes/${attributeId}`,
        body: {
          attribute_id: attributeId,
          name: 'powerOutput',
          description: 'The amount of power available.',
          icon_id: 1400,
          default_value: 0,
          published: true,
          display_name: 'Powergrid Output',
          unit_id: 106,
          stackable: true,
          high_is_good: true,
        },
      });
    });

    when('the client requests attribute details', async () => {
      result = await client.dogma.getAttributeById(attributeId);
    });

    then('the client shall return complete attribute information', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(`/dogma/attributes/${attributeId}/?$`),
      );
      expect(result.attribute_id).toBe(attributeId);
      expect(result.name).toBe('powerOutput');
      expect(result.description).toBe('The amount of power available.');
      expect(result.published).toBe(true);
    });
  });

  test('Unknown attribute ID', ({ given, when, then }) => {
    const invalidId = 999999999;
    let caughtError: any;

    given('an invalid attribute ID', () => {
      queueError(404, 'Attribute not found', {
        match: `/dogma/attributes/${invalidId}`,
      });
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
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Effect index returns numeric IDs', ({ given, when, then }) => {
    const effectIds = [11, 12, 13, 16, 18];
    let result: any;

    given('the dogma effects API is available', () => {
      queueResponse({ match: /\/dogma\/effects\/?$/, body: effectIds });
    });

    when('the client requests all effects', async () => {
      result = await client.dogma.getEffects();
    });

    then('the client shall return an array of effect IDs', () => {
      expect(lastRequest().url.pathname).toMatch(/\/dogma\/effects\/?$/);
      expect(result).toEqual(effectIds);
      result.forEach((id: unknown) => {
        expect(typeof id).toBe('number');
      });
    });
  });

  test('Effect 11 resolves to the lowPower record', ({ given, when, then }) => {
    const effectId = 11;
    let result: any;

    given('a valid effect ID', () => {
      queueResponse({
        match: `/dogma/effects/${effectId}`,
        body: {
          effect_id: effectId,
          name: 'lowPower',
          description: 'Requires a low power slot.',
          published: true,
          display_name: 'Low Power',
          effect_category: 0,
          is_assistance: false,
          is_offensive: false,
          is_warp_safe: true,
          disallow_auto_repeat: false,
          electronic_chance: false,
          range_chance: false,
          pre_expression: 66,
          post_expression: 66,
        },
      });
    });

    when('the client requests effect details', async () => {
      result = await client.dogma.getEffectById(effectId);
    });

    then('the client shall return complete effect information', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(`/dogma/effects/${effectId}/?$`),
      );
      expect(result.effect_id).toBe(effectId);
      expect(result.name).toBe('lowPower');
      expect(result.published).toBe(true);
      expect(result.is_warp_safe).toBe(true);
    });
  });

  test('Unknown effect ID', ({ given, when, then }) => {
    const invalidId = 999999999;
    let caughtError: any;

    given('an invalid effect ID', () => {
      queueError(404, 'Effect not found', {
        match: `/dogma/effects/${invalidId}`,
      });
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
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Abyssal module reports its provenance and rolled stats', ({
    given,
    when,
    then,
  }) => {
    const typeId = 47740;
    const itemId = 1234567890;
    const dogmaAttributes = [
      { attribute_id: 9, value: 1.0 },
      { attribute_id: 20, value: 125.0 },
    ];
    const dogmaEffects = [
      { effect_id: 11, is_default: false },
      { effect_id: 12, is_default: true },
    ];
    let result: any;

    given('a mutated item exists', () => {
      queueResponse({
        match: `/dogma/dynamic/items/${typeId}/${itemId}`,
        body: {
          created_by: 2112625428,
          dogma_attributes: dogmaAttributes,
          dogma_effects: dogmaEffects,
          mutator_type_id: 47842,
          source_type_id: 2048,
        },
      });
    });

    when('the client requests its dynamic dogma info', async () => {
      result = await client.dogma.getDynamicItemInfo(typeId, itemId);
    });

    then('the client shall return modified attributes and effects', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(`/dogma/dynamic/items/${typeId}/${itemId}/?$`),
      );
      expect(result.created_by).toBe(2112625428);
      expect(result.mutator_type_id).toBe(47842);
      expect(result.source_type_id).toBe(2048);
      expect(result.dogma_attributes).toEqual(dogmaAttributes);
      expect(result.dogma_effects).toEqual(dogmaEffects);
    });
  });

  test('Unknown type and item ID pair', ({ given, when, then }) => {
    let caughtError: any;

    given('an invalid type and item ID', () => {
      queueError(404, 'Item not found', {
        match: '/dogma/dynamic/items/999999/999999',
      });
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
        expect(sentRequests()).toHaveLength(1);
      },
    );
  });
});
