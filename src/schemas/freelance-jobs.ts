import { z } from 'zod';

export const EsiCursorSchema = z.looseObject({
  before: z.string().nullable(),
  after: z.string().nullable(),
});

export const FreelanceJobSummarySchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  state: z.string(),
  last_modified: z.string(),
  progress: z.looseObject({
    current: z.number(),
    desired: z.number(),
  }),
  reward: z
    .looseObject({
      initial: z.number(),
      remaining: z.number(),
    })
    .optional(),
});

export const FreelanceJobsListingSchema = z.looseObject({
  cursor: EsiCursorSchema.optional(),
  freelance_jobs: z.array(FreelanceJobSummarySchema),
});

export const FreelanceJobDetailSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  state: z.string(),
  last_modified: z.string(),
  progress: z.looseObject({
    current: z.number(),
    desired: z.number(),
  }),
  reward: z
    .looseObject({
      initial: z.number(),
      remaining: z.number(),
    })
    .optional(),
  details: z.looseObject({
    description: z.string(),
    career: z.string(),
    created: z.string(),
    expires: z.string(),
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
  }),
  configuration: z.looseObject({
    version: z.number(),
    parameters: z.record(z.string(), z.unknown()),
    method: z.string(),
  }),
  contribution: z.looseObject({
    max_committed_participants: z.number(),
    reward_per_contribution: z.number().optional(),
    submission_multiplier: z.number().optional(),
  }),
  access_and_visibility: z.looseObject({
    acl_protected: z.boolean(),
    broadcast_locations: z.array(
      z.looseObject({
        id: z.number(),
        name: z.string(),
      }),
    ),
  }),
});

export const CharacterFreelanceJobsListingSchema = z.looseObject({
  cursor: EsiCursorSchema.optional(),
  freelance_jobs: z.array(FreelanceJobSummarySchema),
});

export const FreelanceJobParticipationSchema = z.looseObject({
  job_id: z.string(),
  character_id: z.number(),
  status: z.string(),
  contributions: z.number(),
  last_contribution: z.string().optional(),
});

export const CorporationFreelanceJobsListingSchema = z.looseObject({
  cursor: EsiCursorSchema.optional(),
  freelance_jobs: z.array(FreelanceJobSummarySchema),
});

export const FreelanceJobParticipantSchema = z.looseObject({
  character_id: z.number(),
  corporation_id: z.number(),
  status: z.string(),
  contributions: z.number(),
  last_contribution: z.string().optional(),
});
