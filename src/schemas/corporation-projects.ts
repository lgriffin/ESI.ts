import { z } from 'zod';
import { esiEnum } from './esiEnum';

/**
 * Opaque cursor tokens on a corporation project page. ESI marks both optional
 * and omits the object on some pages.
 */
export const CorporationProjectCursorSchema = z.looseObject({
  before: z.string().optional(),
  after: z.string().optional(),
});

const ProjectStateSchema = esiEnum([
  'Unspecified',
  'Active',
  'Closed',
  'Completed',
  'Expired',
  'Deleted',
]);

const ProjectProgressSchema = z.looseObject({
  current: z.number(),
  desired: z.number(),
});

const ProjectRewardSchema = z.looseObject({
  initial: z.number(),
  remaining: z.number(),
});

/** One entry of a corporation project list page. */
export const CorporationProjectSummarySchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  state: ProjectStateSchema,
  last_modified: z.string(),
  progress: ProjectProgressSchema,
  reward: ProjectRewardSchema.optional(),
});

/** A page of `GET /corporations/{corporation_id}/projects`. */
export const CorporationProjectsListingSchema = z.looseObject({
  cursor: CorporationProjectCursorSchema.optional(),
  projects: z.array(CorporationProjectSummarySchema),
});

/** `GET /corporations/{corporation_id}/projects/{project_id}`. */
export const CorporationProjectSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  state: ProjectStateSchema,
  last_modified: z.string(),
  progress: ProjectProgressSchema,
  reward: ProjectRewardSchema.optional(),
  creator: z.looseObject({
    id: z.number(),
    name: z.string(),
  }),
  details: z.looseObject({
    career: esiEnum([
      'Unspecified',
      'Explorer',
      'Industrialist',
      'Enforcer',
      'Soldier of Fortune',
    ]),
    created: z.string(),
    description: z.string(),
    expires: z.string().optional(),
    finished: z.string().optional(),
  }),
  /**
   * What counts as a contribution. ESI sends an object with a single key
   * naming the contribution method (`manual`, `deliver_item`,
   * `destroy_ship`, ...) whose value holds that method's parameters.
   */
  configuration: z.record(z.string(), z.unknown()),
  contribution: z
    .looseObject({
      participation_limit: z.number().optional(),
      reward_per_contribution: z.number().optional(),
      submission_limit: z.number().optional(),
      submission_multiplier: z.number().optional(),
    })
    .optional(),
});

/**
 * `GET /corporations/{corporation_id}/projects/{project_id}/contribution/{character_id}`.
 */
export const CorporationProjectContributionSchema = z.looseObject({
  contributed: z.number(),
  last_modified: z.string().optional(),
});

/** One entry of a project contributor page. */
export const CorporationProjectContributorSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  contributed: z.number(),
});

/** A page of `GET /corporations/{corporation_id}/projects/{project_id}/contributors`. */
export const CorporationProjectContributorsListingSchema = z.looseObject({
  contributors: z.array(CorporationProjectContributorSchema),
  cursor: CorporationProjectCursorSchema.optional(),
});
