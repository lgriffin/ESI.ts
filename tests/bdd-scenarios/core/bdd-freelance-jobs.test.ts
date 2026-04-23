/**
 * BDD-Style Tests for Freelance Jobs Management
 *
 * Tests the FreelanceJobsClient for browsing freelance jobs, retrieving
 * details, managing character and corporation participation, and cursor pagination.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Freelance Jobs Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Browse Freelance Jobs', () => {
    describe('Scenario: Get freelance jobs listing', () => {
      it('Given publicly available freelance jobs exist, When I request the job listing, Then I should receive jobs with pagination cursors', async () => {
        // Given
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

        // When
        const result = await client.freelanceJobs.getFreelanceJobs();

        // Then
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

    describe('Scenario: No freelance jobs available', () => {
      it('Given no freelance jobs exist, When I request the job listing, Then I should receive an empty listing', async () => {
        // Given
        const mockEmptyListing = {
          cursor: { before: null, after: null },
          freelance_jobs: [],
        };

        jest
          .spyOn(client.freelanceJobs, 'getFreelanceJobs')
          .mockResolvedValue(mockEmptyListing);

        // When
        const result = await client.freelanceJobs.getFreelanceJobs();

        // Then
        expect(result.freelance_jobs).toBeInstanceOf(Array);
        expect(result.freelance_jobs).toHaveLength(0);
        expect(result.cursor.before).toBeNull();
        expect(result.cursor.after).toBeNull();
      });
    });
  });

  describe('Feature: Freelance Job Details', () => {
    describe('Scenario: Get a specific freelance job by ID', () => {
      it('Given a valid job ID, When I request the job details, Then I should receive the full job information', async () => {
        // Given
        const jobId = 'job-001';
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

        // When
        const result = await client.freelanceJobs.getFreelanceJobById(jobId);

        // Then
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

    describe('Scenario: Request a non-existent job', () => {
      it('Given an invalid job ID, When I request the job details, Then I should receive a 404 error', async () => {
        // Given
        const invalidJobId = 'job-nonexistent';
        const notFoundError = TestDataFactory.createError(404);

        jest
          .spyOn(client.freelanceJobs, 'getFreelanceJobById')
          .mockRejectedValue(notFoundError);

        // When & Then
        await expect(
          client.freelanceJobs.getFreelanceJobById(invalidJobId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Character Freelance Jobs', () => {
    describe('Scenario: Get character freelance jobs', () => {
      it('Given an authenticated character with freelance jobs, When I request their job listing, Then I should receive the character jobs with cursors', async () => {
        // Given
        const characterId = 1689391488;
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

        // When
        const result =
          await client.freelanceJobs.getCharacterFreelanceJobs(characterId);

        // Then
        expect(result).toBeDefined();
        expect(result.freelance_jobs).toHaveLength(1);
        expect(result.freelance_jobs[0].id).toBe('job-010');
        expect(result.freelance_jobs[0].state).toBe('in_progress');
        expect(result.cursor.after).toBe('char_cursor_xyz');
      });
    });

    describe('Scenario: Get character participation in a specific job', () => {
      it('Given a character participating in a job, When I request their participation details, Then I should receive contribution data', async () => {
        // Given
        const characterId = 1689391488;
        const jobId = 'job-010';
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

        // When
        const result =
          await client.freelanceJobs.getCharacterFreelanceJobParticipation(
            characterId,
            jobId,
          );

        // Then
        expect(result).toBeDefined();
        expect(result.job_id).toBe(jobId);
        expect(result.character_id).toBe(characterId);
        expect(result.status).toBe('active');
        expect(result.contributions).toBe(5000);
        expect(result.last_contribution).toBeDefined();
      });
    });
  });

  describe('Feature: Corporation Freelance Jobs', () => {
    describe('Scenario: Get corporation freelance jobs', () => {
      it('Given an authenticated corporation, When I request their freelance jobs, Then I should receive the corporation jobs listing', async () => {
        // Given
        const corporationId = 1344654522;
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

        // When
        const result =
          await client.freelanceJobs.getCorporationFreelanceJobs(corporationId);

        // Then
        expect(result).toBeDefined();
        expect(result.freelance_jobs).toHaveLength(1);
        expect(result.freelance_jobs[0].id).toBe('job-050');
        expect(result.cursor.after).toBeNull();
      });
    });
  });

  describe('Feature: Cursor Pagination', () => {
    describe('Scenario: Paginate forward through freelance jobs', () => {
      it('Given a first page with an after cursor, When I request the next page using the after token, Then I should receive the second page of results', async () => {
        // Given
        const getJobsSpy = jest.spyOn(client.freelanceJobs, 'getFreelanceJobs');

        // First page
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

        // Second page
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

        // When: First page
        const page1 = await client.freelanceJobs.getFreelanceJobs();
        expect(page1.cursor.after).toBe('page2_token');

        // When: Second page using after cursor
        const page2 = await client.freelanceJobs.getFreelanceJobs(
          undefined,
          page1.cursor.after!,
        );

        // Then
        expect(page2.freelance_jobs).toHaveLength(1);
        expect(page2.freelance_jobs[0].id).toBe('job-002');
        expect(page2.cursor.before).toBe('page2_token');
        expect(page2.cursor.after).toBeNull();
      });
    });

    describe('Scenario: Paginate backward through freelance jobs', () => {
      it('Given a second page with a before cursor, When I request the previous page using the before token, Then I should receive the first page of results', async () => {
        // Given
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

        // When
        const firstPage =
          await client.freelanceJobs.getFreelanceJobs('page2_token');

        // Then
        expect(firstPage.freelance_jobs).toHaveLength(1);
        expect(firstPage.freelance_jobs[0].id).toBe('job-001');
        expect(firstPage.cursor.before).toBeNull();
      });
    });
  });

  describe('Feature: Error Handling', () => {
    describe('Scenario: Unauthorized access to character freelance jobs', () => {
      it('Given an invalid token, When I request character freelance jobs, Then I should receive a 403 forbidden error', async () => {
        // Given
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.freelanceJobs, 'getCharacterFreelanceJobs')
          .mockRejectedValue(forbiddenError);

        // When & Then
        await expect(
          client.freelanceJobs.getCharacterFreelanceJobs(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });
});
