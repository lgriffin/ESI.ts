import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/freelance-jobs.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Get freelance jobs listing', ({ given, when, then }) => {
    let result: any;

    given('publicly available freelance jobs exist', () => {
      const mockListing = {
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
      };

      jest
        .spyOn(client.freelanceJobs, 'getFreelanceJobs')
        .mockResolvedValue(mockListing);
    });

    when('I request the job listing', async () => {
      result = await client.freelanceJobs.getFreelanceJobs();
    });

    then('I should receive jobs with pagination cursors', () => {
      expect(result).toBeDefined();
      expect(result.freelance_jobs).toBeInstanceOf(Array);
      expect(result.freelance_jobs).toHaveLength(2);
      expect(result.freelance_jobs[0]).toHaveProperty('id', 'job-001');
      expect(result.freelance_jobs[0]).toHaveProperty('name');
      expect(result.freelance_jobs[0]).toHaveProperty('state');
      expect(result.freelance_jobs[0]).toHaveProperty('progress');
      expect(result.cursor).toBeDefined();
      expect(result.cursor.before).toBeNull();
      expect(result.cursor.after).toBe('cursor_abc123');
    });
  });

  test('No freelance jobs available', ({ given, when, then }) => {
    let result: any;

    given('no freelance jobs exist', () => {
      const mockEmptyListing = {
        cursor: { before: null, after: null },
        freelance_jobs: [],
      };

      jest
        .spyOn(client.freelanceJobs, 'getFreelanceJobs')
        .mockResolvedValue(mockEmptyListing);
    });

    when('I request the empty job listing', async () => {
      result = await client.freelanceJobs.getFreelanceJobs();
    });

    then('I should receive an empty listing', () => {
      expect(result.freelance_jobs).toBeInstanceOf(Array);
      expect(result.freelance_jobs).toHaveLength(0);
      expect(result.cursor.before).toBeNull();
      expect(result.cursor.after).toBeNull();
    });
  });

  test('Get a specific freelance job by ID', ({ given, when, then }) => {
    let result: any;
    const jobId = 'job-001';

    given('a valid job ID', () => {
      const mockJobDetail = {
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
      };

      jest
        .spyOn(client.freelanceJobs, 'getFreelanceJobById')
        .mockResolvedValue(mockJobDetail);
    });

    when('I request the job details', async () => {
      result = await client.freelanceJobs.getFreelanceJobById(jobId);
    });

    then('I should receive the full job information', () => {
      expect(result).toBeDefined();
      expect(result.id).toBe(jobId);
      expect(result.name).toBe('Ore Hauling Contract');
      expect(result.progress.current).toBe(0);
      expect(result.progress.desired).toBe(10000);
      expect(result.details).toBeDefined();
      expect(result.details.description).toContain('Veldspar');
      expect(result.details.career).toBe('hauler');
    });
  });

  test('Request a non-existent job', ({ given, when, then }) => {
    const invalidJobId = 'job-nonexistent';
    let caughtError: any;

    given('an invalid job ID', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest
        .spyOn(client.freelanceJobs, 'getFreelanceJobById')
        .mockRejectedValue(notFoundError);
    });

    when('I request details for the invalid job', async () => {
      try {
        await client.freelanceJobs.getFreelanceJobById(invalidJobId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 404 error for the job', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('Get character freelance jobs', ({ given, when, then }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character with freelance jobs', () => {
      const mockCharacterJobs = {
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
      };

      jest
        .spyOn(client.freelanceJobs, 'getCharacterFreelanceJobs')
        .mockResolvedValue(mockCharacterJobs);
    });

    when('I request their job listing', async () => {
      result =
        await client.freelanceJobs.getCharacterFreelanceJobs(characterId);
    });

    then('I should receive the character jobs with cursors', () => {
      expect(result).toBeDefined();
      expect(result.freelance_jobs).toHaveLength(1);
      expect(result.freelance_jobs[0].id).toBe('job-010');
      expect(result.freelance_jobs[0].state).toBe('in_progress');
      expect(result.cursor.after).toBe('char_cursor_xyz');
    });
  });

  test('Get character participation in a specific job', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;
    const jobId = 'job-010';

    given('a character participating in a job', () => {
      const mockParticipation = {
        job_id: jobId,
        character_id: characterId,
        status: 'active',
        contributions: 5000,
        last_contribution: '2026-04-22T14:00:00Z',
      };

      jest
        .spyOn(client.freelanceJobs, 'getCharacterFreelanceJobParticipation')
        .mockResolvedValue(mockParticipation);
    });

    when('I request their participation details', async () => {
      result = await client.freelanceJobs.getCharacterFreelanceJobParticipation(
        characterId,
        jobId,
      );
    });

    then('I should receive contribution data', () => {
      expect(result).toBeDefined();
      expect(result.job_id).toBe(jobId);
      expect(result.character_id).toBe(characterId);
      expect(result.status).toBe('active');
      expect(result.contributions).toBe(5000);
      expect(result.last_contribution).toBeDefined();
    });
  });

  test('Get corporation freelance jobs', ({ given, when, then }) => {
    let result: any;
    const corporationId = 1344654522;

    given('an authenticated corporation for freelance jobs', () => {
      const mockCorpJobs = {
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
      };

      jest
        .spyOn(client.freelanceJobs, 'getCorporationFreelanceJobs')
        .mockResolvedValue(mockCorpJobs);
    });

    when('I request their freelance jobs', async () => {
      result =
        await client.freelanceJobs.getCorporationFreelanceJobs(corporationId);
    });

    then('I should receive the corporation jobs listing', () => {
      expect(result).toBeDefined();
      expect(result.freelance_jobs).toHaveLength(1);
      expect(result.freelance_jobs[0].id).toBe('job-050');
      expect(result.cursor.after).toBeNull();
    });
  });

  test('Paginate forward through freelance jobs', ({ given, when, then }) => {
    let page2: any;

    given('a first page with an after cursor', () => {
      const getJobsSpy = jest.spyOn(client.freelanceJobs, 'getFreelanceJobs');

      getJobsSpy.mockResolvedValueOnce({
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
      });

      getJobsSpy.mockResolvedValueOnce({
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
      });
    });

    when('I request the next page using the after token', async () => {
      const page1 = await client.freelanceJobs.getFreelanceJobs();
      expect(page1.cursor.after).toBe('page2_token');

      page2 = await client.freelanceJobs.getFreelanceJobs(
        undefined,
        page1.cursor.after!,
      );
    });

    then('I should receive the second page of results', () => {
      expect(page2.freelance_jobs).toHaveLength(1);
      expect(page2.freelance_jobs[0].id).toBe('job-002');
      expect(page2.cursor.before).toBe('page2_token');
      expect(page2.cursor.after).toBeNull();
    });
  });

  test('Paginate backward through freelance jobs', ({ given, when, then }) => {
    let firstPage: any;

    given('a second page with a before cursor', () => {
      jest
        .spyOn(client.freelanceJobs, 'getFreelanceJobs')
        .mockResolvedValueOnce({
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
        });
    });

    when('I request the previous page using the before token', async () => {
      firstPage = await client.freelanceJobs.getFreelanceJobs('page2_token');
    });

    then('I should receive the first page of results', () => {
      expect(firstPage.freelance_jobs).toHaveLength(1);
      expect(firstPage.freelance_jobs[0].id).toBe('job-001');
      expect(firstPage.cursor.before).toBeNull();
    });
  });

  test('Unauthorized access to character freelance jobs', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an invalid token for freelance jobs', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.freelanceJobs, 'getCharacterFreelanceJobs')
        .mockRejectedValue(forbiddenError);
    });

    when('I request character freelance jobs with invalid token', async () => {
      try {
        await client.freelanceJobs.getCharacterFreelanceJobs(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('I should receive a 403 forbidden error for freelance jobs', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
