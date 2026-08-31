import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/0010-cosmetics.feature');

const TEST_CHARACTER_ID = 123456;

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN getting character SKINR licenses, the client shall return owned designs', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedSkinr = {
      licenses: [
        {
          skinr_id: 'abc-123',
          activated: true,
          unactivated: 2,
        },
        {
          skinr_id: 'def-456',
          activated: false,
          unactivated: 1,
        },
      ],
    };

    given('the character owns SKINR licenses', () => {
      jest
        .spyOn(client.cosmetics, 'getCharacterSkinr')
        .mockResolvedValue(expectedSkinr as any);
    });

    when('the client requests character SKINR', async () => {
      result = await client.cosmetics.getCharacterSkinr(TEST_CHARACTER_ID);
    });

    then('the client shall return the license data', () => {
      expect(result).toBeDefined();
      expect(result.licenses).toHaveLength(2);
      expect(result.licenses[0].skinr_id).toBe('abc-123');
      expect(result.licenses[0].activated).toBe(true);
      expect(result.licenses[1].unactivated).toBe(1);
    });
  });

  test('WHEN getting SKINR components, the client shall return component licenses', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedComponents = {
      licenses: [
        {
          component_id: 67890,
          type: 'nanocoating',
          runs: { remaining: 5 },
        },
        {
          component_id: 67891,
          type: 'pattern',
          runs: { unlimited: true },
        },
      ],
    };

    given('the character owns SKINR components', () => {
      jest
        .spyOn(client.cosmetics, 'getCharacterSkinrComponents')
        .mockResolvedValue(expectedComponents as any);
    });

    when('the client requests SKINR components', async () => {
      result =
        await client.cosmetics.getCharacterSkinrComponents(TEST_CHARACTER_ID);
    });

    then('the client shall return component data with types', () => {
      expect(result).toBeDefined();
      expect(result.licenses).toHaveLength(2);
      expect(result.licenses[0].component_id).toBe(67890);
      expect(result.licenses[0].type).toBe('nanocoating');
      expect(result.licenses[0].runs.remaining).toBe(5);
      expect(result.licenses[1].type).toBe('pattern');
      expect(result.licenses[1].runs.unlimited).toBe(true);
    });
  });

  test('WHEN looking up a public SKINR design, the client shall return design attributes', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedSkinr = {
      id: 'skinr-abc-123',
      name: 'Crimson Fury',
      creator_id: 90000001,
      ship_type_id: 587,
      line: 'Crimson',
      tier: { level: 3 },
      layout: {
        slots: [{}],
        pattern_blend_mode: 'normal',
      },
    };

    given('a public SKINR design exists', () => {
      jest
        .spyOn(client.cosmetics, 'getSkinr')
        .mockResolvedValue(expectedSkinr as any);
    });

    when('the client requests SKINR attributes', async () => {
      result = await client.cosmetics.getSkinr('skinr-abc-123');
    });

    then('the client shall return the design layout and tier', () => {
      expect(result).toBeDefined();
      expect(result.id).toBe('skinr-abc-123');
      expect(result.name).toBe('Crimson Fury');
      expect(result.tier.level).toBe(3);
      expect(result.layout.pattern_blend_mode).toBe('normal');
      expect(result.layout.slots).toHaveLength(1);
    });
  });

  test('WHILE character has no SKINR licenses, the client shall return empty results', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('the character has no SKINR licenses', () => {
      jest
        .spyOn(client.cosmetics, 'getCharacterSkinr')
        .mockResolvedValue({ licenses: [] } as any);
    });

    when('the client requests character SKINR', async () => {
      result = await client.cosmetics.getCharacterSkinr(TEST_CHARACTER_ID);
    });

    then('the client shall return an empty license list', () => {
      expect(result).toBeDefined();
      expect(result.licenses).toHaveLength(0);
    });
  });

  test('IF service unavailable error, THEN the client shall handle the service outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is down', () => {
      const error = TestDataFactory.createError(503);
      jest
        .spyOn(client.cosmetics, 'getCharacterSkinr')
        .mockRejectedValue(error);
    });

    when('the client requests cosmetics data', async () => {
      try {
        await client.cosmetics.getCharacterSkinr(TEST_CHARACTER_ID);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 503 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
