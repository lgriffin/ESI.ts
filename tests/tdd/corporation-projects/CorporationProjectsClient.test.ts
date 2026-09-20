import { ApiClient } from '../../../src/core/ApiClient';
import { CorporationProjectsClient } from '../../../src/clients/CorporationProjectsClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

const CORPORATION_ID = 98000001;
const PROJECT_ID = '3868eaed-8278-4cb7-9709-7d7de9c20dc7';

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

  it('should get a page of corporation projects', async () => {
    const mockResponse = {
      cursor: { before: 'b-token', after: 'a-token' },
      projects: [
        {
          id: PROJECT_ID,
          name: 'Stock the staging hangar',
          state: 'Active',
          last_modified: '2026-09-15T18:30:00Z',
          progress: { current: 750, desired: 1000 },
          reward: { initial: 500000000, remaining: 125000000 },
        },
        {
          id: '9b1f2c7e-4d3a-4b8e-a6f1-2c5d7e9a0b13',
          name: 'Defend the home complex',
          state: 'Completed',
          last_modified: '2026-08-01T08:00:00Z',
          progress: { current: 40, desired: 40 },
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      corporationProjectsClient.getCorporationProjects(CORPORATION_ID),
    );
    expect(result).toEqual(mockResponse);
    expect(result.projects.map((p: { id: string }) => p.id)).toEqual([
      PROJECT_ID,
      '9b1f2c7e-4d3a-4b8e-a6f1-2c5d7e9a0b13',
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://esi.evetech.net/corporations/${CORPORATION_ID}/projects`,
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty(
      'Authorization',
      'Bearer my-token',
    );
  });

  it('should pass cursor tokens as before and after query parameters', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ projects: [] }));
    fetchMock.mockResponseOnce(JSON.stringify({ contributors: [] }));

    await getBody(() =>
      corporationProjectsClient.getCorporationProjects(
        CORPORATION_ID,
        undefined,
        'a-token',
      ),
    );
    await getBody(() =>
      corporationProjectsClient.getCorporationProjectContributors(
        CORPORATION_ID,
        PROJECT_ID,
        'b-token',
      ),
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://esi.evetech.net/corporations/${CORPORATION_ID}/projects?after=a-token`,
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      `https://esi.evetech.net/corporations/${CORPORATION_ID}/projects/${PROJECT_ID}/contributors?before=b-token`,
    );
  });

  it('should get a specific corporation project by UUID', async () => {
    const mockResponse = {
      id: PROJECT_ID,
      name: 'Stock the staging hangar',
      state: 'Active',
      last_modified: '2026-09-15T18:30:00Z',
      progress: { current: 750, desired: 1000 },
      creator: { id: 90439768, name: 'Project Creator' },
      details: {
        career: 'Industrialist',
        created: '2026-09-01T12:00:00Z',
        description: 'Deliver hulls.',
      },
      configuration: { manual: {} },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      corporationProjectsClient.getCorporationProject(
        CORPORATION_ID,
        PROJECT_ID,
      ),
    );
    expect(result).toEqual(mockResponse);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://esi.evetech.net/corporations/${CORPORATION_ID}/projects/${PROJECT_ID}`,
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty(
      'Authorization',
      'Bearer my-token',
    );
  });

  it('should get a character contribution to a corporation project', async () => {
    const mockResponse = {
      contributed: 500,
      last_modified: '2026-09-15T18:30:00Z',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      corporationProjectsClient.getCorporationProjectContribution(
        CORPORATION_ID,
        PROJECT_ID,
        90439768,
      ),
    );
    expect(result).toEqual(mockResponse);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://esi.evetech.net/corporations/${CORPORATION_ID}/projects/${PROJECT_ID}/contribution/90439768`,
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty(
      'Authorization',
      'Bearer my-token',
    );
  });

  it('should get a page of corporation project contributors', async () => {
    const mockResponse = {
      contributors: [
        { id: 90439768, name: 'First Contributor', contributed: 500 },
        { id: 90439769, name: 'Second Contributor', contributed: 300 },
      ],
      cursor: { after: 'a-token' },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      corporationProjectsClient.getCorporationProjectContributors(
        CORPORATION_ID,
        PROJECT_ID,
      ),
    );
    expect(result).toEqual(mockResponse);
    for (const contributor of result.contributors) {
      expect(typeof contributor.id).toBe('number');
      expect(typeof contributor.contributed).toBe('number');
    }
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://esi.evetech.net/corporations/${CORPORATION_ID}/projects/${PROJECT_ID}/contributors`,
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty(
      'Authorization',
      'Bearer my-token',
    );
  });

  describeClientErrors('CorporationProjectsClient', (apiClient) =>
    new CorporationProjectsClient(apiClient).getCorporationProjects(
      CORPORATION_ID,
    ),
  );
});
