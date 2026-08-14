import * as fc from 'fast-check';
import {
  MilitaryCampaignSchema,
  MilitaryCampaignObjectiveSchema,
  CharacterMilitaryCampaignObjectiveSchema,
  CorporationProjectSchema,
  CorporationProjectContributionSchema,
  CorporationProjectContributorSchema,
} from '../../src/schemas';

const uuidArb = fc.uuid();

const dateArb = fc
  .integer({
    min: new Date('2000-01-01').getTime(),
    max: new Date('2030-01-01').getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

const militaryCampaignArb = fc.record({
  campaign_id: uuidArb,
  state: fc.constantFrom('active', 'completed', 'pending'),
  progress: fc.double({ min: 0, max: 1, noNaN: true }),
  start_time: dateArb,
});

const objectiveArb = fc.record({
  objective_id: uuidArb,
  campaign_id: uuidArb,
  state: fc.constantFrom('in_progress', 'completed', 'pending'),
  progress: fc.double({ min: 0, max: 1, noNaN: true }),
  participants: fc.record({
    total: fc.nat({ max: 10000 }),
    committed: fc.nat({ max: 10000 }),
    contributors: fc.nat({ max: 10000 }),
  }),
});

const charObjectiveArb = fc.record({
  objective_id: uuidArb,
  campaign_id: uuidArb,
  committed: fc.boolean(),
  contribution: fc.nat({ max: 100000 }),
});

const corpProjectArb = fc.record({
  project_id: fc.nat({ max: 1000000 }),
  state: fc.constantFrom('active', 'completed', 'paused'),
  progress: fc.double({ min: 0, max: 1, noNaN: true }),
  start_time: dateArb,
});

const corpContributionArb = fc.record({
  character_id: fc.nat({ max: 2147483647 }),
  contribution: fc.nat({ max: 1000000 }),
});

describe('Military Campaign schema property tests', () => {
  it('should accept any well-formed campaign object', () => {
    fc.assert(
      fc.property(militaryCampaignArb, (data) => {
        const result = MilitaryCampaignSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should accept any well-formed objective object', () => {
    fc.assert(
      fc.property(objectiveArb, (data) => {
        const result = MilitaryCampaignObjectiveSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should accept any well-formed character objective', () => {
    fc.assert(
      fc.property(charObjectiveArb, (data) => {
        const result = CharacterMilitaryCampaignObjectiveSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should reject campaign_id when not a string', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
        (badId) => {
          const result = MilitaryCampaignSchema.safeParse({
            campaign_id: badId,
            state: 'active',
            progress: 0.5,
            start_time: '2026-01-01T00:00:00Z',
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe('Corporation Project schema property tests', () => {
  it('should accept any well-formed project object', () => {
    fc.assert(
      fc.property(corpProjectArb, (data) => {
        const result = CorporationProjectSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should accept any well-formed contribution object', () => {
    fc.assert(
      fc.property(corpContributionArb, (data) => {
        const result = CorporationProjectContributionSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should accept any well-formed contributor object', () => {
    fc.assert(
      fc.property(corpContributionArb, (data) => {
        const result = CorporationProjectContributorSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should reject project_id when not a number', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.boolean(), fc.constant(null)),
        (badId) => {
          const result = CorporationProjectSchema.safeParse({
            project_id: badId,
            state: 'active',
            progress: 0.5,
            start_time: '2026-01-01T00:00:00Z',
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 50 },
    );
  });
});
