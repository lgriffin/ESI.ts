import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature(
  'tests/bdd/features/core/corporation-projects.feature',
);

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN listing corporation projects, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 98000001;

    given('a valid corporation ID with projects', () => {
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

      jest
        .spyOn(client.corporationProjects, 'getCorporationProjects')
        .mockResolvedValue(expectedProjects);
    });

    when('the client requests corporation projects', async () => {
      result =
        await client.corporationProjects.getCorporationProjects(corporationId);
    });

    then('the client shall return an array of projects', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('project_id');
      expect(result[0]).toHaveProperty('state');
      expect(result[0]).toHaveProperty('progress');
      expect(result[0]).toHaveProperty('start_time');
    });
  });

  test('WHEN getting specific project details, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 98000001;
    const projectId = 1001;

    given('a valid corporation ID and project ID', () => {
      const expectedProject = {
        project_id: 1001,
        state: 'active',
        progress: 0.75,
        start_time: '2026-01-15T10:00:00Z',
        finish_time: '2026-03-15T10:00:00Z',
      };

      jest
        .spyOn(client.corporationProjects, 'getCorporationProject')
        .mockResolvedValue(expectedProject);
    });

    when('the client requests project details', async () => {
      result = await client.corporationProjects.getCorporationProject(
        corporationId,
        projectId,
      );
    });

    then('the client shall return complete project information', () => {
      expect(result).toBeDefined();
      expect(result.project_id).toBe(1001);
      expect(result.state).toBe('active');
      expect(result.progress).toBe(0.75);
      expect(result).toHaveProperty('start_time');
      expect(result).toHaveProperty('finish_time');
    });
  });

  test('WHEN getting project contributors, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 98000001;
    const projectId = 1001;

    given('a corporation project with contributors', () => {
      const expectedContributors = [
        { character_id: 90439768, contribution: 500 },
        { character_id: 90439769, contribution: 300 },
      ];

      jest
        .spyOn(client.corporationProjects, 'getCorporationProjectContributors')
        .mockResolvedValue(expectedContributors);
    });

    when('the client requests project contributors', async () => {
      result =
        await client.corporationProjects.getCorporationProjectContributors(
          corporationId,
          projectId,
        );
    });

    then('the client shall return an array of contributors', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('character_id');
      expect(result[0]).toHaveProperty('contribution');
      expect(typeof result[0].character_id).toBe('number');
      expect(typeof result[0].contribution).toBe('number');
    });
  });

  test('WHEN getting character contribution, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const corporationId = 98000001;
    const projectId = 1001;
    const characterId = 90439768;

    given('a character who contributed to a project', () => {
      const expectedContribution = {
        character_id: 90439768,
        contribution: 500,
      };

      jest
        .spyOn(client.corporationProjects, 'getCorporationProjectContribution')
        .mockResolvedValue(expectedContribution);
    });

    when('the client requests the character contribution', async () => {
      result =
        await client.corporationProjects.getCorporationProjectContribution(
          corporationId,
          projectId,
          characterId,
        );
    });

    then('the client shall return the contribution details', () => {
      expect(result).toBeDefined();
      expect(result.character_id).toBe(90439768);
      expect(result.contribution).toBe(500);
    });
  });

  test('IF non-existent project ID, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 98000001;
    const invalidProjectId = 999999999;
    let error: any;

    given('an invalid project ID', () => {
      const expectedError = TestDataFactory.createError(404);

      jest
        .spyOn(client.corporationProjects, 'getCorporationProject')
        .mockRejectedValue(expectedError);
    });

    when('the client requests details for the invalid project', async () => {
      try {
        await client.corporationProjects.getCorporationProject(
          corporationId,
          invalidProjectId,
        );
      } catch (e) {
        error = e;
      }
    });

    then('the client shall return a not found error', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });
});
