import { ApiClient } from '../../../src/core/ApiClient';
import { CorporationProjectsClient } from '../../../src/clients/CorporationProjectsClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

describe('CorporationProjectsClient', () => {
  let client: ApiClient;
  let corporationProjectsClient: CorporationProjectsClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new ApiClient('test', 'https://esi.evetech.net', 'my-token');
    const rateLimiter = new RateLimiter();
    rateLimiter.setTestMode(true);
    client.setRateLimiter(rateLimiter);
    corporationProjectsClient = new CorporationProjectsClient(client);
  });

  it('should get corporation projects', async () => {
    const mockResponse = [
      {
        project_id: 1001,
        state: 'active',
        progress: 0.75,
        start_time: '2026-01-15T10:00:00Z',
        finish_time: '2026-03-15T10:00:00Z',
      },
      {
        project_id: 1002,
        state: 'completed',
        progress: 1.0,
        start_time: '2025-11-01T08:00:00Z',
        finish_time: '2026-01-01T08:00:00Z',
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      corporationProjectsClient.getCorporationProjects(98000001),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    result.forEach((project: any) => {
      expect(project).toHaveProperty('project_id');
      expect(typeof project.project_id).toBe('number');
      expect(project).toHaveProperty('state');
      expect(project).toHaveProperty('progress');
      expect(project).toHaveProperty('start_time');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/corporations/98000001/projects',
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty(
      'Authorization',
      'Bearer my-token',
    );
  });

  it('should get a specific corporation project', async () => {
    const mockResponse = {
      project_id: 1001,
      state: 'active',
      progress: 0.75,
      start_time: '2026-01-15T10:00:00Z',
      finish_time: '2026-03-15T10:00:00Z',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      corporationProjectsClient.getCorporationProject(98000001, 1001),
    );
    expect(result).toHaveProperty('project_id', 1001);
    expect(result).toHaveProperty('state', 'active');
    expect(result).toHaveProperty('progress', 0.75);
    expect(result).toHaveProperty('start_time');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/corporations/98000001/projects/1001',
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty(
      'Authorization',
      'Bearer my-token',
    );
  });

  it('should get a character contribution to a corporation project', async () => {
    const mockResponse = {
      character_id: 90439768,
      contribution: 500,
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      corporationProjectsClient.getCorporationProjectContribution(
        98000001,
        1001,
        90439768,
      ),
    );
    expect(result).toHaveProperty('character_id', 90439768);
    expect(result).toHaveProperty('contribution', 500);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/corporations/98000001/projects/1001/contribution/90439768',
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty(
      'Authorization',
      'Bearer my-token',
    );
  });

  it('should get corporation project contributors', async () => {
    const mockResponse = [
      {
        character_id: 90439768,
        contribution: 500,
      },
      {
        character_id: 90439769,
        contribution: 300,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      corporationProjectsClient.getCorporationProjectContributors(
        98000001,
        1001,
      ),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    result.forEach((contributor: any) => {
      expect(contributor).toHaveProperty('character_id');
      expect(typeof contributor.character_id).toBe('number');
      expect(contributor).toHaveProperty('contribution');
      expect(typeof contributor.contribution).toBe('number');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/corporations/98000001/projects/1001/contributors',
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty(
      'Authorization',
      'Bearer my-token',
    );
  });

  describeClientErrors('CorporationProjectsClient', () =>
    corporationProjectsClient.getCorporationProjects(98000001),
  );
});
