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
  'tests/bdd/features/core/0004-corporation-projects.feature',
);

const CORPORATION_ID = 98000001;
const PROJECT_ID = 1001;

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Project list holding an active project and a completed project', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedProjects = [
      {
        project_id: 1001,
        state: 'active',
        progress: 0.75,
        start_time: '2026-01-15T10:00:00Z',
      },
      {
        project_id: 1002,
        state: 'completed',
        progress: 1.0,
        start_time: '2025-11-01T08:00:00Z',
        finish_time: '2026-01-01T08:00:00Z',
      },
    ];

    given('a valid corporation ID with projects', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/projects`,
        body: expectedProjects,
      });
    });

    when('the client requests corporation projects', async () => {
      result =
        await client.corporationProjects.getCorporationProjects(CORPORATION_ID);
    });

    then('the client shall return an array of projects', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toMatch(
        new RegExp(`/corporations/${CORPORATION_ID}/projects/?$`),
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedProjects);
      expect(result.map((p: any) => p.project_id)).toEqual([1001, 1002]);
      expect(result.map((p: any) => p.state)).toEqual(['active', 'completed']);
      expect(result.map((p: any) => p.progress)).toEqual([0.75, 1.0]);
      expect(result.map((p: any) => p.start_time)).toEqual([
        '2026-01-15T10:00:00Z',
        '2025-11-01T08:00:00Z',
      ]);
    });
  });

  test('Detail record for an active project', ({ given, when, then }) => {
    let result: any;
    const expectedProject = {
      project_id: PROJECT_ID,
      state: 'active',
      progress: 0.75,
      start_time: '2026-01-15T10:00:00Z',
      finish_time: '2026-03-15T10:00:00Z',
    };

    given('a valid corporation ID and project ID', () => {
      queueResponse({
        match: `/corporations/${CORPORATION_ID}/projects/${PROJECT_ID}`,
        body: expectedProject,
      });
    });

    when('the client requests project details', async () => {
      result = await client.corporationProjects.getCorporationProject(
        CORPORATION_ID,
        PROJECT_ID,
      );
    });

    then('the client shall return complete project information', () => {
      const request = lastRequest();
      expect(request.url.pathname).toMatch(
        new RegExp(`/corporations/${CORPORATION_ID}/projects/${PROJECT_ID}/?$`),
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedProject);
    });
  });

  test('Contributor roll for a project with two participants', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedContributors = [
      { character_id: 90439768, contribution: 500 },
      { character_id: 90439769, contribution: 300 },
    ];

    given('a corporation project with contributors', () => {
      queueResponse({
        match: `/projects/${PROJECT_ID}/contributors`,
        body: expectedContributors,
      });
    });

    when('the client requests project contributors', async () => {
      result =
        await client.corporationProjects.getCorporationProjectContributors(
          CORPORATION_ID,
          PROJECT_ID,
        );
    });

    then('the client shall return an array of contributors', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(
          `/corporations/${CORPORATION_ID}/projects/${PROJECT_ID}/contributors/?$`,
        ),
      );
      expect(result).toEqual(expectedContributors);
      for (const entry of result) {
        expect(typeof entry.character_id).toBe('number');
        expect(typeof entry.contribution).toBe('number');
      }
    });
  });

  test('Single contributor looked up by character ID', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 90439768;

    given('a character who contributed to a project', () => {
      queueResponse({
        match: `/projects/${PROJECT_ID}/contribution/${characterId}`,
        body: { character_id: characterId, contribution: 500 },
      });
    });

    when('the client requests the character contribution', async () => {
      result =
        await client.corporationProjects.getCorporationProjectContribution(
          CORPORATION_ID,
          PROJECT_ID,
          characterId,
        );
    });

    then('the client shall return the contribution details', () => {
      expect(lastRequest().url.pathname).toMatch(
        new RegExp(
          `/corporations/${CORPORATION_ID}/projects/${PROJECT_ID}/contribution/${characterId}/?$`,
        ),
      );
      expect(result).toEqual({ character_id: 90439768, contribution: 500 });
    });
  });

  test('Unknown project ID rejects the request', ({ given, when, then }) => {
    const invalidProjectId = 999999999;
    let error: any;

    given('an invalid project ID', () => {
      queueError(404, 'Project not found', {
        match: `/projects/${invalidProjectId}`,
      });
    });

    when('the client requests details for the invalid project', async () => {
      try {
        await client.corporationProjects.getCorporationProject(
          CORPORATION_ID,
          invalidProjectId,
        );
      } catch (e) {
        error = e;
      }
    });

    then('the client shall return a not found error', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(404);
      // 404 is not retryable: one request, one rejection.
      expect(sentRequests()).toHaveLength(1);
    });
  });
});
