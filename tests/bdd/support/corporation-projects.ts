/**
 * What ESI's corporation project endpoints send back in
 * 0004-corporation-projects.feature, and where. Step files queue these; they
 * do not build payloads or URLs themselves.
 *
 * Shapes follow the ESI OpenAPI spec (CorporationsProjectsListing,
 * CorporationsProjectsDetail, CorporationsProjectsContributors,
 * CorporationsProjectsContribution): projects are identified by UUID strings
 * and both lists are pages wrapped in an object with an optional cursor.
 */

export const PROJECT_CORPORATION_ID = 98000001;
export const ACTIVE_PROJECT_ID = '3868eaed-8278-4cb7-9709-7d7de9c20dc7';
export const COMPLETED_PROJECT_ID = '9b1f2c7e-4d3a-4b8e-a6f1-2c5d7e9a0b13';
export const UNKNOWN_PROJECT_ID = '00000000-0000-4000-8000-000000000000';
export const CONTRIBUTOR_CHARACTER_ID = 90439768;
export const SECOND_CONTRIBUTOR_CHARACTER_ID = 90439769;
// Readable stand-ins: ESI's real cursors are opaque base64, which secret
// scanners flag as high-entropy strings.
export const CURSOR_TOKEN = 'bdd-projects-page-2-cursor';

export const projectPaths = {
  list: (corporationId: number) =>
    new RegExp(`/corporations/${corporationId}/projects/?(\\?|$)`),
  detail: (corporationId: number, projectId: string) =>
    new RegExp(`/corporations/${corporationId}/projects/${projectId}/?(\\?|$)`),
  contributors: (corporationId: number, projectId: string) =>
    new RegExp(
      `/corporations/${corporationId}/projects/${projectId}/contributors/?(\\?|$)`,
    ),
  contribution: (
    corporationId: number,
    projectId: string,
    characterId: number,
  ) =>
    new RegExp(
      `/corporations/${corporationId}/projects/${projectId}/contribution/${characterId}/?(\\?|$)`,
    ),
};

export const projectFixtures = {
  /** One active project with a reward pool and one completed project. */
  listPage: () => ({
    cursor: { before: 'bdd-projects-page-0-cursor', after: CURSOR_TOKEN },
    projects: [
      {
        id: ACTIVE_PROJECT_ID,
        name: 'Stock the Jita staging hangar',
        state: 'Active',
        last_modified: '2026-09-15T18:30:00Z',
        progress: { current: 750, desired: 1000 },
        reward: { initial: 500000000, remaining: 125000000 },
      },
      {
        id: COMPLETED_PROJECT_ID,
        name: 'Defend the home complex',
        state: 'Completed',
        last_modified: '2026-08-01T08:00:00Z',
        progress: { current: 40, desired: 40 },
      },
    ],
  }),

  /** A final page: no entries and no cursor. */
  emptyPage: () => ({ projects: [] }),

  detail: () => ({
    id: ACTIVE_PROJECT_ID,
    name: 'Stock the Jita staging hangar',
    state: 'Active',
    last_modified: '2026-09-15T18:30:00Z',
    progress: { current: 750, desired: 1000 },
    reward: { initial: 500000000, remaining: 125000000 },
    creator: { id: CONTRIBUTOR_CHARACTER_ID, name: 'Project Creator' },
    details: {
      career: 'Industrialist',
      created: '2026-09-01T12:00:00Z',
      description: 'Deliver hulls to the staging hangar.',
      expires: '2026-10-01T12:00:00Z',
    },
    configuration: { manual: {} },
    contribution: {
      participation_limit: 1000,
      reward_per_contribution: 500000,
      submission_limit: 100,
      submission_multiplier: 1,
    },
  }),

  contributorsPage: () => ({
    contributors: [
      {
        id: CONTRIBUTOR_CHARACTER_ID,
        name: 'First Contributor',
        contributed: 500,
      },
      {
        id: SECOND_CONTRIBUTOR_CHARACTER_ID,
        name: 'Second Contributor',
        contributed: 300,
      },
    ],
    cursor: { after: CURSOR_TOKEN },
  }),

  emptyContributorsPage: () => ({ contributors: [] }),

  contribution: () => ({
    contributed: 500,
    last_modified: '2026-09-15T18:30:00Z',
  }),

  contributionWithoutModificationTime: () => ({ contributed: 0 }),
};
