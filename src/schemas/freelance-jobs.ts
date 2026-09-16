import { z } from 'zod';
import { esiEnum } from './esiEnum';

/**
 * Opaque cursor tokens on a freelance job page (ESI's `Cursor`). Both are
 * optional strings: ESI omits a token when there is nothing to page towards
 * in that direction.
 */
export const EsiCursorSchema = z.looseObject({
  before: z.string().optional(),
  after: z.string().optional(),
});

const ParticipationStateSchema = esiEnum([
  'Unspecified',
  'Committed',
  'Kicked',
  'Resigned',
]);

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
    expires: z.string().optional(),
    finished: z.string().optional(),
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
  contribution: z
    .looseObject({
      max_committed_participants: z.number(),
      contribution_per_participant_limit: z.number().optional(),
      reward_per_contribution: z.number().optional(),
      submission_limit: z.number().optional(),
      submission_multiplier: z.number().optional(),
    })
    .optional(),
  access_and_visibility: z.looseObject({
    acl_protected: z.boolean(),
    broadcast_locations: z
      .array(
        z.looseObject({
          id: z.number(),
          name: z.string(),
        }),
      )
      .optional(),
    restrictions: z
      .looseObject({
        minimum_age: z.number().optional(),
        maximum_age: z.number().optional(),
      })
      .optional(),
  }),
});

export const CharacterFreelanceJobsListingSchema = z.looseObject({
  cursor: EsiCursorSchema.optional(),
  freelance_jobs: z.array(FreelanceJobSummarySchema),
});

/**
 * A character's participation in one freelance job, from
 * `GET /characters/{character_id}/freelance-jobs/{job_id}/participation`.
 */
export const FreelanceJobParticipationSchema = z.looseObject({
  state: ParticipationStateSchema,
  contributed: z.number(),
  last_modified: z.string(),
});

export const CorporationFreelanceJobsListingSchema = z.looseObject({
  cursor: EsiCursorSchema.optional(),
  freelance_jobs: z.array(FreelanceJobSummarySchema),
});

/** One participant in a corporation's freelance job. */
export const FreelanceJobParticipantSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  state: ParticipationStateSchema,
  contributed: z.number(),
});

/**
 * The participant roll of a corporation's freelance job, from
 * `GET /corporations/{corporation_id}/freelance-jobs/{job_id}/participants`.
 */
export const FreelanceJobParticipantsListingSchema = z.looseObject({
  cursor: EsiCursorSchema.optional(),
  participants: z.array(FreelanceJobParticipantSchema),
});
