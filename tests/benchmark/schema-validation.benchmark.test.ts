import {
  MilitaryCampaignSchema,
  MilitaryCampaignObjectiveSchema,
  CorporationProjectSchema,
  CorporationProjectContributorSchema,
} from '../../src/schemas';

const validCampaign = {
  campaign_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  state: 'active',
  progress: 0.75,
  start_time: '2026-08-01T00:00:00Z',
};

const validObjective = {
  objective_id: 'obj-001',
  campaign_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  state: 'in_progress',
  progress: 0.5,
  participants: { total: 100, committed: 75, contributors: 50 },
};

const validProject = {
  project_id: 1001,
  state: 'active',
  progress: 0.45,
  start_time: '2026-01-15T00:00:00Z',
};

const validContributor = {
  character_id: 123456789,
  contribution: 500,
};

const invalidData = { campaign_id: 12345, state: null, progress: 'bad' };

describe('Schema validation benchmarks', () => {
  it('parse 10K military campaign objects under 2s', () => {
    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      MilitaryCampaignSchema.safeParse(validCampaign);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it('parse 10K military campaign objectives under 2s', () => {
    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      MilitaryCampaignObjectiveSchema.safeParse(validObjective);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it('parse 10K corporation project objects under 2s', () => {
    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      CorporationProjectSchema.safeParse(validProject);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it('parse 10K corporation contributors under 2s', () => {
    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      CorporationProjectContributorSchema.safeParse(validContributor);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it('safeParse 10K invalid objects under 2s', () => {
    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      MilitaryCampaignSchema.safeParse(invalidData);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
