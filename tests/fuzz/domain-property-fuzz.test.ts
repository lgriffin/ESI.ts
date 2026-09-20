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

const progressArb = fc.record({
  current: fc.nat({ max: 1000000 }),
  desired: fc.nat({ max: 1000000 }),
});

const corpProjectArb = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  state: fc.constantFrom('Active', 'Closed', 'Completed', 'Expired'),
  last_modified: dateArb,
  progress: progressArb,
  creator: fc.record({
    id: fc.nat({ max: 2147483647 }),
    name: fc.string({ minLength: 1, maxLength: 37 }),
  }),
  details: fc.record({
    career: fc.constantFrom('Explorer', 'Industrialist', 'Enforcer'),
    created: dateArb,
    description: fc.string({ maxLength: 200 }),
  }),
  configuration: fc.constantFrom({ manual: {} }, { destroy_ship: {} }),
});

const corpContributionArb = fc.record(
  {
    contributed: fc.nat({ max: 1000000 }),
    last_modified: dateArb,
  },
  { requiredKeys: ['contributed'] },
);

const corpContributorArb = fc.record({
  id: fc.nat({ max: 2147483647 }),
  name: fc.string({ minLength: 1, maxLength: 37 }),
  contributed: fc.nat({ max: 1000000 }),
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
      fc.property(corpContributorArb, (data) => {
        const result = CorporationProjectContributorSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should reject id when not a string', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
        (badId) => {
          const result = CorporationProjectSchema.safeParse({
            id: badId,
            name: 'Project Name',
            state: 'Active',
            last_modified: '2026-01-01T00:00:00Z',
            progress: { current: 5, desired: 10 },
            creator: { id: 90000001, name: 'Creator Name' },
            details: {
              career: 'Explorer',
              created: '2026-01-01T00:00:00Z',
              description: 'Project Description',
            },
            configuration: { manual: {} },
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 50 },
    );
  });
});
