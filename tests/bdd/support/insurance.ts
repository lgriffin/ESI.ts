/**
 * What ESI's insurance price endpoint sends back in 0018-insurance.feature,
 * and where. Step files queue these; they do not build payloads or URLs
 * themselves.
 */

export const INSURANCE_PRICES_PATH = '/insurance/prices';

/** Matches the price list URL, with or without a trailing slash. */
export const INSURANCE_PRICES_MATCH = /\/insurance\/prices\/?$/;

export const LARGE_SHIP_TYPE_COUNT = 500;
export const LARGE_RESPONSE_BUDGET_MS = 1000;

export const TIER_NAMES = [
  'Basic',
  'Standard',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
] as const;

/** One ship type's six-level ladder, each level doubling the previous one. */
function ladder(typeId: number, baseCost: number) {
  return {
    type_id: typeId,
    levels: TIER_NAMES.map((name, i) => ({
      cost: baseCost * Math.pow(2, i),
      name,
      payout: baseCost * 2 * Math.pow(2, i),
    })),
  };
}

export const insuranceFixtures = {
  /** A frigate and a battleship. */
  frigateAndBattleship: () => [
    {
      type_id: 587,
      levels: [
        { cost: 10.0, name: 'Basic', payout: 20.0 },
        { cost: 25.0, name: 'Standard', payout: 50.0 },
        { cost: 50.0, name: 'Bronze', payout: 100.0 },
        { cost: 100.0, name: 'Silver', payout: 200.0 },
        { cost: 200.0, name: 'Gold', payout: 400.0 },
        { cost: 400.0, name: 'Platinum', payout: 800.0 },
      ],
    },
    {
      type_id: 29984,
      levels: [
        { cost: 1000000.0, name: 'Basic', payout: 2000000.0 },
        { cost: 2500000.0, name: 'Standard', payout: 5000000.0 },
        { cost: 5000000.0, name: 'Bronze', payout: 10000000.0 },
        { cost: 10000000.0, name: 'Silver', payout: 20000000.0 },
        { cost: 20000000.0, name: 'Gold', payout: 40000000.0 },
        { cost: 40000000.0, name: 'Platinum', payout: 80000000.0 },
      ],
    },
  ],

  tierLadders: () => [ladder(587, 10.0), ladder(24690, 500000.0)],

  risingTiers: () => [
    {
      type_id: 24690,
      levels: [
        { cost: 500000.0, name: 'Basic', payout: 1000000.0 },
        { cost: 1250000.0, name: 'Standard', payout: 2500000.0 },
        { cost: 2500000.0, name: 'Bronze', payout: 5000000.0 },
        { cost: 5000000.0, name: 'Silver', payout: 10000000.0 },
        { cost: 10000000.0, name: 'Gold', payout: 20000000.0 },
        { cost: 20000000.0, name: 'Platinum', payout: 40000000.0 },
      ],
    },
  ],

  payoutTiers: () => [
    {
      type_id: 17918,
      levels: [
        { cost: 3000000.0, name: 'Basic', payout: 6000000.0 },
        { cost: 7500000.0, name: 'Standard', payout: 15000000.0 },
        { cost: 15000000.0, name: 'Bronze', payout: 30000000.0 },
        { cost: 30000000.0, name: 'Silver', payout: 60000000.0 },
        { cost: 60000000.0, name: 'Gold', payout: 120000000.0 },
        { cost: 120000000.0, name: 'Platinum', payout: 240000000.0 },
      ],
    },
  ],

  largePriceList: () =>
    Array.from({ length: LARGE_SHIP_TYPE_COUNT }, (_, i) =>
      ladder(1000 + i, 100.0 * (i + 1)),
    ),
};
