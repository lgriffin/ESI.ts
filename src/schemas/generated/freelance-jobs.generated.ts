 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersFreelanceJobsListingSchema = z.looseObject({
  freelance_jobs: z.array(z.looseObject({
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

export const CharactersFreelanceJobsParticipationSchema = z.looseObject({
  contributed: z.number(),
  last_modified: z.string(),
  state: z.enum(['Unspecified', 'Committed', 'Kicked', 'Resigned']),
});

export const CorporationsFreelanceJobsListingSchema = z.looseObject({
  cursor: z.looseObject({
    after: z.string().optional(),
    before: z.string().optional(),
  }).optional(),
  freelance_jobs: z.array(z.looseObject({
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

export const CorporationsFreelanceJobsParticipantsSchema = z.looseObject({
  cursor: z.looseObject({
    after: z.string().optional(),
    before: z.string().optional(),
  }).optional(),
  participants: z.array(z.looseObject({
    contributed: z.number(),
    id: z.number(),
    name: z.string(),
    state: z.enum(['Unspecified', 'Committed', 'Kicked', 'Resigned']),
  })),
});

export const FreelanceJobsDetailSchema = z.looseObject({
  access_and_visibility: z.looseObject({
    acl_protected: z.boolean(),
    broadcast_locations: z.array(z.looseObject({
      id: z.number(),
      name: z.string(),
    })).optional(),
    restrictions: z.looseObject({
      maximum_age: z.number().optional(),
      minimum_age: z.number().optional(),
    }).optional(),
  }),
  configuration: z.looseObject({
    method: z.string(),
    parameters: z.record(z.string(), z.unknown()),
    version: z.number(),
  }),
  contribution: z.looseObject({
    contribution_per_participant_limit: z.number().optional(),
    max_committed_participants: z.number(),
    reward_per_contribution: z.number().optional(),
    submission_limit: z.number().optional(),
    submission_multiplier: z.number().optional(),
  }).optional(),
  details: z.looseObject({
    career: z.enum(['Unspecified', 'Explorer', 'Industrialist', 'Enforcer', 'Soldier of Fortune']),
    created: z.string(),
    creator: z.looseObject({
      character: z.looseObject({
        id: z.number(),
        name: z.string(),
      }),
      corporation: z.looseObject({
        id: z.number(),
        name: z.string(),
      }),
    }),
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

export const FreelanceJobsListingSchema = z.looseObject({
  cursor: z.looseObject({
    after: z.string().optional(),
    before: z.string().optional(),
  }).optional(),
  freelance_jobs: z.array(z.looseObject({
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
