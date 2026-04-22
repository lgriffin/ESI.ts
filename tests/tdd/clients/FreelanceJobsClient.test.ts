import { FreelanceJobsClient } from '../../../src/clients/FreelanceJobsClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { resetETagCache } from '../../../src/core/ApiRequestHandler';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const MOCK_LISTING = {
  cursor: { before: 'b1', after: 'a1' },
  freelance_jobs: [
    {
      id: 'job-1',
      name: 'Veldspar Collection',
      state: 'Active',
      last_modified: '2026-03-24T14:56:19.967Z',
      progress: { current: 100, desired: 1000 },
      reward: { initial: 750000000, remaining: 660000000 },
    },
    {
      id: 'job-2',
      name: 'Mine Plagioclase',
      state: 'Active',
      last_modified: '2026-03-24T14:58:36.465Z',
      progress: { current: 50, desired: 500 },
      reward: { initial: 500000000, remaining: 450000000 },
    },
  ],
};

const MOCK_DETAIL = {
  id: 'job-1',
  name: 'Veldspar Collection',
  state: 'Active',
  last_modified: '2026-03-24T14:56:19.967Z',
  progress: { current: 100, desired: 1000 },
  reward: { initial: 750000000, remaining: 660000000 },
  details: {
    description: '',
    career: 'Industrialist',
    created: '2026-03-10T19:31:05.319Z',
    expires: '2026-04-10T19:30:00Z',
    creator: {
      character: { id: 2113400501, name: 'Ha Chee' },
      corporation: { id: 98574078, name: 'Safe Deposit Service' },
    },
  },
  configuration: {
    version: 1,
    parameters: {},
    method: 'DeliverItem',
  },
  contribution: {
    max_committed_participants: 10000,
    reward_per_contribution: 6,
    submission_multiplier: 1,
  },
  access_and_visibility: {
    acl_protected: false,
    broadcast_locations: [{ id: 30000144, name: 'Perimeter' }],
  },
};

describe('FreelanceJobsClient', () => {
  let client: FreelanceJobsClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    resetETagCache();
    const rateLimiter = RateLimiter.getInstance();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    const apiClient = new ApiClient(
      'test',
      'https://esi.evetech.net',
      undefined,
    );
    client = new FreelanceJobsClient(apiClient);
  });

  describe('getFreelanceJobs', () => {
    it('should fetch the public freelance jobs listing', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_LISTING));

      const result = await client.getFreelanceJobs();

      expect(result.cursor.before).toBe('b1');
      expect(result.cursor.after).toBe('a1');
      expect(result.freelance_jobs).toHaveLength(2);
      expect(result.freelance_jobs[0].name).toBe('Veldspar Collection');
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/freelance-jobs',
      );
    });

    it('should pass after cursor as query parameter', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_LISTING));

      await client.getFreelanceJobs(undefined, 'my-cursor-token');

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/freelance-jobs?after=my-cursor-token',
      );
    });

    it('should pass before cursor as query parameter', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_LISTING));

      await client.getFreelanceJobs('before-token');

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/freelance-jobs?before=before-token',
      );
    });

    it('should return empty listing at end of dataset', async () => {
      const empty = {
        cursor: { before: 'b-end', after: null },
        freelance_jobs: [],
      };
      fetchMock.mockResponseOnce(JSON.stringify(empty));

      const result = await client.getFreelanceJobs(undefined, 'last-cursor');

      expect(result.freelance_jobs).toHaveLength(0);
      expect(result.cursor.after).toBeNull();
    });
  });

  describe('getFreelanceJobById', () => {
    it('should fetch a specific job by UUID', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_DETAIL));

      const result = await client.getFreelanceJobById('job-1');

      expect(result.name).toBe('Veldspar Collection');
      expect(result.details.career).toBe('Industrialist');
      expect(result.configuration.method).toBe('DeliverItem');
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/freelance-jobs/job-1',
      );
    });
  });

  describe('getCharacterFreelanceJobs', () => {
    it('should fetch character freelance jobs with auth', async () => {
      const authedApiClient = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'my-token',
      );
      const authedClient = new FreelanceJobsClient(authedApiClient);

      fetchMock.mockResponseOnce(JSON.stringify(MOCK_LISTING));

      await authedClient.getCharacterFreelanceJobs(12345);

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/characters/12345/freelance-jobs',
      );
      const headers = fetchMock.mock.calls[0][1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Authorization']).toBe('Bearer my-token');
    });

    it('should pass cursor params for character listing', async () => {
      const authedApiClient = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'my-token',
      );
      const authedClient = new FreelanceJobsClient(authedApiClient);

      fetchMock.mockResponseOnce(JSON.stringify(MOCK_LISTING));

      await authedClient.getCharacterFreelanceJobs(
        12345,
        undefined,
        'cursor-tok',
      );

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/characters/12345/freelance-jobs?after=cursor-tok',
      );
    });
  });

  describe('getCharacterFreelanceJobParticipation', () => {
    it('should fetch participation for a specific job', async () => {
      const authedApiClient = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'my-token',
      );
      const authedClient = new FreelanceJobsClient(authedApiClient);
      const mockParticipation = { status: 'committed', contributions: 5 };

      fetchMock.mockResponseOnce(JSON.stringify(mockParticipation));

      const result = await authedClient.getCharacterFreelanceJobParticipation(
        12345,
        'job-1',
      );

      expect(result.status).toBe('committed');
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/characters/12345/freelance-jobs/job-1/participation',
      );
    });
  });

  describe('getCorporationFreelanceJobs', () => {
    it('should fetch corporation freelance jobs with auth', async () => {
      const authedApiClient = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'my-token',
      );
      const authedClient = new FreelanceJobsClient(authedApiClient);

      fetchMock.mockResponseOnce(JSON.stringify(MOCK_LISTING));

      await authedClient.getCorporationFreelanceJobs(98574078);

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/corporations/98574078/freelance-jobs',
      );
      const headers = fetchMock.mock.calls[0][1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Authorization']).toBe('Bearer my-token');
    });
  });

  describe('getCorporationFreelanceJobParticipants', () => {
    it('should fetch participants for a corporation job', async () => {
      const authedApiClient = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'my-token',
      );
      const authedClient = new FreelanceJobsClient(authedApiClient);
      const mockParticipants = [{ character_id: 111 }, { character_id: 222 }];

      fetchMock.mockResponseOnce(JSON.stringify(mockParticipants));

      const result = await authedClient.getCorporationFreelanceJobParticipants(
        98574078,
        'job-1',
      );

      expect(result).toHaveLength(2);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/corporations/98574078/freelance-jobs/job-1/participants',
      );
    });
  });
});
