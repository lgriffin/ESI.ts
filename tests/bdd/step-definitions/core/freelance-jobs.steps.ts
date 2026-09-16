import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature(
  'tests/bdd/features/core/0015-freelance-jobs.feature',
);

const BEARER = 'Bearer bdd-access-token';

/**
 * Match a URL whose path is exactly `path` (query string allowed), so the
 * public `/freelance-jobs` listing does not also serve owner-scoped paths.
 */
function exactPath(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https://esi\\.evetech\\.net${escaped}(\\?|$)`);
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Open and in-progress jobs with a forward cursor', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('publicly available freelance jobs exist', () => {
      queueResponse({
        match: exactPath('/freelance-jobs'),
        body: {
          cursor: { before: null, after: 'cursor_abc123' },
          freelance_jobs: [
            {
              id: 'job-001',
              name: 'Ore Hauling Contract',
              state: 'open',
              last_modified: '2026-04-20T10:00:00Z',
              progress: { current: 0, desired: 10000 },
              reward: { initial: 5000000, remaining: 5000000 },
            },
            {
              id: 'job-002',
              name: 'Salvage Operation',
              state: 'in_progress',
              last_modified: '2026-04-21T08:30:00Z',
              progress: { current: 3500, desired: 10000 },
              reward: { initial: 10000000, remaining: 6500000 },
            },
          ],
        },
      });
    });

    when('the client requests the job listing', async () => {
      result = await client.freelanceJobs.getFreelanceJobs();
    });

    then('the client shall return jobs with pagination cursors', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe('/freelance-jobs');
      expect(request.url.searchParams.has('before')).toBe(false);
      expect(request.url.searchParams.has('after')).toBe(false);

      expect(
        result.freelance_jobs.map((job: any) => [
          job.id,
          job.name,
          job.state,
          job.progress,
        ]),
      ).toEqual([
        [
          'job-001',
          'Ore Hauling Contract',
          'open',
          { current: 0, desired: 10000 },
        ],
        [
          'job-002',
          'Salvage Operation',
          'in_progress',
          { current: 3500, desired: 10000 },
        ],
      ]);
      expect(result.cursor).toEqual({ before: null, after: 'cursor_abc123' });
    });
  });

  test('No jobs published', ({ given, when, then }) => {
    let result: any;

    given('no freelance jobs exist', () => {
      queueResponse({
        match: exactPath('/freelance-jobs'),
        body: { cursor: { before: null, after: null }, freelance_jobs: [] },
      });
    });

    when('the client requests the empty job listing', async () => {
      result = await client.freelanceJobs.getFreelanceJobs();
    });

    then('the client shall return an empty listing', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(result).toEqual({
        cursor: { before: null, after: null },
        freelance_jobs: [],
      });
    });
  });

  test('Hauling contract exposes its description and career', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const jobId = 'job-001';

    given('a valid job ID', () => {
      queueResponse({
        match: exactPath(`/freelance-jobs/${jobId}`),
        body: {
          id: jobId,
          name: 'Ore Hauling Contract',
          state: 'open',
          last_modified: '2026-04-20T10:00:00Z',
          progress: { current: 0, desired: 10000 },
          reward: { initial: 5000000, remaining: 5000000 },
          details: {
            description: 'Haul 10000 units of Veldspar from Jita to Amarr',
            career: 'hauler',
            created: '2026-04-19T08:00:00Z',
            expires: '2026-05-19T08:00:00Z',
            creator: {
              character: { id: 1689391488, name: 'Test Character' },
              corporation: { id: 1344654522, name: 'GoonWaffe' },
            },
          },
          configuration: {
            version: 1,
            parameters: {},
            method: 'standard',
          },
          contribution: {
            max_committed_participants: 10,
            reward_per_contribution: 500,
            submission_multiplier: 1.0,
          },
          access_and_visibility: {
            acl_protected: false,
            broadcast_locations: [{ id: 30000142, name: 'Jita' }],
          },
        },
      });
    });

    when('the client requests the job details', async () => {
      result = await client.freelanceJobs.getFreelanceJobById(jobId);
    });

    then('the client shall return the full job information', () => {
      expect(lastRequest().url.pathname).toBe(`/freelance-jobs/${jobId}`);
      expect(result.id).toBe(jobId);
      expect(result.name).toBe('Ore Hauling Contract');
      expect(result.progress).toEqual({ current: 0, desired: 10000 });
      expect(result.details.description).toBe(
        'Haul 10000 units of Veldspar from Jita to Amarr',
      );
      expect(result.details.career).toBe('hauler');
    });
  });

  test('Unknown job ID', ({ given, when, then }) => {
    const invalidJobId = 'job-nonexistent';
    let caughtError: any;

    given('an invalid job ID', () => {
      queueError(404, 'Freelance job not found', {
        match: exactPath(`/freelance-jobs/${invalidJobId}`),
      });
    });

    when('the client requests details for the invalid job', async () => {
      try {
        await client.freelanceJobs.getFreelanceJobById(invalidJobId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 404 error for the job', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test("Character's own jobs", ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character with freelance jobs', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/freelance-jobs`),
        body: {
          cursor: { before: null, after: 'char_cursor_xyz' },
          freelance_jobs: [
            {
              id: 'job-010',
              name: 'Mining Expedition',
              state: 'in_progress',
              last_modified: '2026-04-22T14:00:00Z',
              progress: { current: 5000, desired: 20000 },
              reward: { initial: 15000000, remaining: 11250000 },
            },
          ],
        },
      });
    });

    when('the client requests their job listing', async () => {
      result =
        await client.freelanceJobs.getCharacterFreelanceJobs(characterId);
    });

    then('the client shall return the character jobs with cursors', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/freelance-jobs`,
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(result.freelance_jobs.map((job: any) => job.id)).toEqual([
        'job-010',
      ]);
      expect(result.freelance_jobs[0].state).toBe('in_progress');
      expect(result.freelance_jobs[0].progress).toEqual({
        current: 5000,
        desired: 20000,
      });
      expect(result.cursor).toEqual({ before: null, after: 'char_cursor_xyz' });
    });
  });

  test('Character contribution to a mining job', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;
    const jobId = 'job-010';

    given('a character participating in a job', () => {
      queueResponse({
        match: exactPath(
          `/characters/${characterId}/freelance-jobs/${jobId}/participation`,
        ),
        body: {
          job_id: jobId,
          character_id: characterId,
          status: 'active',
          contributions: 5000,
          last_contribution: '2026-04-22T14:00:00Z',
        },
      });
    });

    when('the client requests their participation details', async () => {
      result = await client.freelanceJobs.getCharacterFreelanceJobParticipation(
        characterId,
        jobId,
      );
    });

    then('the client shall return contribution data', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/freelance-jobs/${jobId}/participation`,
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(result).toEqual({
        job_id: jobId,
        character_id: characterId,
        status: 'active',
        contributions: 5000,
        last_contribution: '2026-04-22T14:00:00Z',
      });
    });
  });

  test("Corporation's own jobs", ({ given, when, then }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated corporation for freelance jobs', () => {
      queueResponse({
        match: exactPath(`/corporations/${corporationId}/freelance-jobs`),
        body: {
          cursor: { before: null, after: null },
          freelance_jobs: [
            {
              id: 'job-050',
              name: 'Structure Defense Op',
              state: 'open',
              last_modified: '2026-04-23T06:00:00Z',
              progress: { current: 0, desired: 50 },
            },
          ],
        },
      });
    });

    when('the client requests their freelance jobs', async () => {
      result =
        await client.freelanceJobs.getCorporationFreelanceJobs(corporationId);
    });

    then('the client shall return the corporation jobs listing', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(
        `/corporations/${corporationId}/freelance-jobs`,
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(result.freelance_jobs.map((job: any) => job.id)).toEqual([
        'job-050',
      ]);
      expect(result.freelance_jobs[0].name).toBe('Structure Defense Op');
      expect(result.cursor).toEqual({ before: null, after: null });
    });
  });

  test('Following the after token to page two', ({ given, when, then }) => {
    let page1: any;
    let page2: any;

    given('a first page with an after cursor', () => {
      queueResponse({
        match: /\/freelance-jobs\?after=page2_token$/,
        body: {
          cursor: { before: 'page2_token', after: null },
          freelance_jobs: [
            {
              id: 'job-002',
              name: 'Job 2',
              state: 'open',
              last_modified: '2026-04-21T10:00:00Z',
              progress: { current: 0, desired: 200 },
            },
          ],
        },
      });
      queueResponse({
        match: exactPath('/freelance-jobs'),
        body: {
          cursor: { before: null, after: 'page2_token' },
          freelance_jobs: [
            {
              id: 'job-001',
              name: 'Job 1',
              state: 'open',
              last_modified: '2026-04-20T10:00:00Z',
              progress: { current: 0, desired: 100 },
            },
          ],
        },
      });
    });

    when(
      'the client requests the next page using the after token',
      async () => {
        page1 = await client.freelanceJobs.getFreelanceJobs();
        page2 = await client.freelanceJobs.getFreelanceJobs(
          undefined,
          page1.cursor!.after!,
        );
      },
    );

    then('the client shall return the second page of results', () => {
      const requests = sentRequests();
      expect(requests).toHaveLength(2);
      expect(requests[0].url.search).toBe('');
      expect(requests[1].url.pathname).toBe('/freelance-jobs');
      expect(requests[1].url.searchParams.get('after')).toBe('page2_token');
      expect(requests[1].url.searchParams.has('before')).toBe(false);

      expect(page1.freelance_jobs.map((job: any) => job.id)).toEqual([
        'job-001',
      ]);
      expect(page2.freelance_jobs.map((job: any) => job.id)).toEqual([
        'job-002',
      ]);
      expect(page2.cursor).toEqual({ before: 'page2_token', after: null });
    });
  });

  test('Following the before token back to page one', ({
    given,
    when,
    then,
  }) => {
    let firstPage: any;

    given('a second page with a before cursor', () => {
      queueResponse({
        match: /\/freelance-jobs\?before=page2_token$/,
        body: {
          cursor: { before: null, after: 'page2_token' },
          freelance_jobs: [
            {
              id: 'job-001',
              name: 'Job 1',
              state: 'open',
              last_modified: '2026-04-20T10:00:00Z',
              progress: { current: 0, desired: 100 },
            },
          ],
        },
      });
    });

    when(
      'the client requests the previous page using the before token',
      async () => {
        firstPage = await client.freelanceJobs.getFreelanceJobs('page2_token');
      },
    );

    then('the client shall return the first page of results', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe('/freelance-jobs');
      expect(request.url.searchParams.get('before')).toBe('page2_token');
      expect(request.url.searchParams.has('after')).toBe(false);
      expect(firstPage.freelance_jobs.map((job: any) => job.id)).toEqual([
        'job-001',
      ]);
      expect(firstPage.cursor).toEqual({ before: null, after: 'page2_token' });
    });
  });

  test('Character jobs with an invalid token', ({ given, when, then }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an invalid token for freelance jobs', () => {
      queueError(403, 'token not valid for scope', {
        match: exactPath(`/characters/${characterId}/freelance-jobs`),
      });
    });

    when(
      'the client requests character freelance jobs with invalid token',
      async () => {
        try {
          await client.freelanceJobs.getCharacterFreelanceJobs(characterId);
        } catch (error) {
          caughtError = error;
        }
      },
    );

    then(
      'the client shall return a 403 forbidden error for freelance jobs',
      () => {
        expect(caughtError).toBeInstanceOf(EsiError);
        expect((caughtError as EsiError).statusCode).toBe(403);
        expect(sentRequests()).toHaveLength(1);
        expect(lastRequest().headers.authorization).toBe(BEARER);
      },
    );
  });
});
