 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CorporationsProjectsContributionSchema = z.looseObject({
  contributed: z.number(),
  last_modified: z.string().optional(),
});

export const CorporationsProjectsContributorsSchema = z.looseObject({
  contributors: z.array(z.looseObject({
    contributed: z.number(),
    id: z.number(),
    name: z.string(),
  })),
  cursor: z.looseObject({
    after: z.string().optional(),
    before: z.string().optional(),
  }).optional(),
});

export const CorporationsProjectsDetailSchema = z.looseObject({
  configuration: z.unknown(),
  contribution: z.looseObject({
    participation_limit: z.number().optional(),
    reward_per_contribution: z.number().optional(),
    submission_limit: z.number().optional(),
    submission_multiplier: z.number().optional(),
  }).optional(),
  creator: z.looseObject({
    id: z.number(),
    name: z.string(),
  }),
  details: z.looseObject({
    career: z.enum(['Unspecified', 'Explorer', 'Industrialist', 'Enforcer', 'Soldier of Fortune']),
    created: z.string(),
    description: z.string(),
    expires: z.string().optional(),
    finished: z.string().optional(),
  }),
  id: z.string(),
  last_modified: z.string(),
  name: z.string(),
  progress: z.looseObject({
    current: z.number(),
    desired: z.number(),
  }),
  reward: z.looseObject({
    initial: z.number(),
    remaining: z.number(),
  }).optional(),
  state: z.enum(['Unspecified', 'Active', 'Closed', 'Completed', 'Expired', 'Deleted']),
});

export const CorporationsProjectsListingSchema = z.looseObject({
  cursor: z.looseObject({
    after: z.string().optional(),
    before: z.string().optional(),
  }).optional(),
  projects: z.array(z.looseObject({
    id: z.string(),
    last_modified: z.string(),
    name: z.string(),
    progress: z.looseObject({
      current: z.number(),
      desired: z.number(),
    }),
    reward: z.looseObject({
      initial: z.number(),
      remaining: z.number(),
    }).optional(),
    state: z.enum(['Unspecified', 'Active', 'Closed', 'Completed', 'Expired', 'Deleted']),
  })),
});
