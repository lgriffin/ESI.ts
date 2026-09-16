import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  RETRYABLE_ATTEMPTS,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0010-cosmetics.feature');

const TEST_CHARACTER_ID = 123456;

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Licence list holding an activated design and an unactivated one', ({
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
      queueResponse({
        match: `/characters/${TEST_CHARACTER_ID}/cosmetics/skinr`,
        body: expectedSkinr,
      });
    });

    when('the client requests character SKINR', async () => {
      result = await client.cosmetics.getCharacterSkinr(TEST_CHARACTER_ID);
    });

    then('the client shall return the license data', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${TEST_CHARACTER_ID}/cosmetics/skinr`,
      );
      expect(lastRequest().headers.authorization).toBe(
        'Bearer bdd-access-token',
      );
      expect(result).toEqual({
        licenses: [
          { skinr_id: 'abc-123', activated: true, unactivated: 2 },
          { skinr_id: 'def-456', activated: false, unactivated: 1 },
        ],
      });
    });
  });

  test('Component list holding a limited-run nanocoating and an unlimited pattern', ({
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
      queueResponse({
        match: `/characters/${TEST_CHARACTER_ID}/cosmetics/skinr/components`,
        body: expectedComponents,
      });
    });

    when('the client requests SKINR components', async () => {
      result =
        await client.cosmetics.getCharacterSkinrComponents(TEST_CHARACTER_ID);
    });

    then('the client shall return component data with types', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${TEST_CHARACTER_ID}/cosmetics/skinr/components`,
      );
      expect(lastRequest().headers.authorization).toBe(
        'Bearer bdd-access-token',
      );
      expect(result.licenses).toHaveLength(2);
      expect(result.licenses[0].component_id).toBe(67890);
      expect(result.licenses[1].component_id).toBe(67891);
      expect(result.licenses[0].type).toBe('nanocoating');
      expect(result.licenses[0].runs.remaining).toBe(5);
      expect(result.licenses[1].type).toBe('pattern');
      expect(result.licenses[1].runs.unlimited).toBe(true);
    });
  });

  test('Public design record with tier level and layout slots', ({
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
      queueResponse({
        match: '/cosmetics/skinr/skinr-abc-123',
        body: expectedSkinr,
      });
    });

    when('the client requests SKINR attributes', async () => {
      result = await client.cosmetics.getSkinr('skinr-abc-123');
    });

    then('the client shall return the design layout and tier', () => {
      expect(lastRequest().url.pathname).toBe('/cosmetics/skinr/skinr-abc-123');
      expect(result.id).toBe('skinr-abc-123');
      expect(result.name).toBe('Crimson Fury');
      expect(result.tier.level).toBe(3);
      expect(result.layout.pattern_blend_mode).toBe('normal');
      expect(result.layout.slots).toEqual([{}]);
      expect(result.creator_id).toBe(90000001);
      expect(result.ship_type_id).toBe(587);
    });
  });

  test('Character owning no SKINR licences', ({ given, when, then }) => {
    let result: any;

    given('the character has no SKINR licenses', () => {
      queueResponse({
        match: `/characters/${TEST_CHARACTER_ID}/cosmetics/skinr`,
        body: { licenses: [] },
      });
    });

    when('the client requests character SKINR', async () => {
      result = await client.cosmetics.getCharacterSkinr(TEST_CHARACTER_ID);
    });

    then('the client shall return an empty license list', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual({ licenses: [] });
    });
  });

  test('Service outage rejects the request', ({ given, when, then }) => {
    let caughtError: any;

    given('the ESI service is down', () => {
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Service Unavailable', {
        match: `/characters/${TEST_CHARACTER_ID}/cosmetics/skinr`,
        times: RETRYABLE_ATTEMPTS,
      });
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
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });
});
