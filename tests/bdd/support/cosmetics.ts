/**
 * What ESI's SKINR endpoints send back in 0010-cosmetics.feature, and where.
 * Step files queue these; they do not build payloads or URLs themselves.
 */

export const SKINR_CHARACTER_ID = 123456;
export const CRIMSON_FURY_SKINR_ID = 'skinr-abc-123';

export const cosmeticsPaths = {
  characterSkinr: (characterId: number) =>
    `/characters/${characterId}/cosmetics/skinr`,
  characterComponents: (characterId: number) =>
    `/characters/${characterId}/cosmetics/skinr/components`,
  skinr: (skinrId: string) => `/cosmetics/skinr/${skinrId}`,
};

export const cosmeticsFixtures = {
  /** One activated design and one still unactivated. */
  licences: () => ({
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
  }),

  /** A limited-run nanocoating and an unlimited pattern. */
  components: () => ({
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
  }),

  crimsonFury: () => ({
    id: CRIMSON_FURY_SKINR_ID,
    name: 'Crimson Fury',
    creator_id: 90000001,
    ship_type_id: 587,
    line: 'Crimson',
    tier: { level: 3 },
    layout: {
      slots: [{}],
      pattern_blend_mode: 'normal',
    },
  }),
};
