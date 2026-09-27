import { MilitaryCampaignsClient } from '../../../src/clients/MilitaryCampaignsClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';
import type {
  CharacterMilitaryCampaignObjectivesResponse,
  MilitaryCampaignObjectivesResponse,
  MilitaryCampaignsResponse,
} from '../../../src';

fetchMock.enableMocks();

const CAMPAIGN_ID = 'c1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6';
const OBJECTIVE_ID = '0b1e2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

// The shapes ESI sends from compatibility date 2026-08-18: lists are wrapped
// in { campaigns } or { objectives, cursor }.
const MOCK_CAMPAIGN = {
  id: CAMPAIGN_ID,
  state: 'Active',
  progress: 12,
  started: '2026-07-01T00:00:00Z',
};

const MOCK_CAMPAIGNS: MilitaryCampaignsResponse = {
  campaigns: [
    MOCK_CAMPAIGN,
    {
      id: 'd2b3c4d5-e6f7-48b9-80d1-e2f3a4b5c6d7',
      state: 'Completed',
      progress: 30,
      started: '2026-06-01T00:00:00Z',
      finished: '2026-06-30T23:59:59Z',
    },
  ],
};

const MOCK_OBJECTIVE = {
  id: OBJECTIVE_ID,
  state: 'Active',
  progress: 3,
  last_modified: '2026-07-02T10:00:00Z',
  participants: {
    total: 150,
    committed: 80,
    contributors: 45,
  },
};

const MOCK_OBJECTIVES: MilitaryCampaignObjectivesResponse = {
  objectives: [
    MOCK_OBJECTIVE,
    {
      id: '5f6a7b8c-9d0e-4f1a-9b2c-3d4e5f6a7b8c',
      state: 'Completed',
      progress: 10,
      last_modified: '2026-07-03T10:00:00Z',
      participants: {
        total: 200,
        committed: 120,
        contributors: 95,
      },
    },
  ],
  cursor: { after: 'next-page' },
};

const MOCK_CHARACTER_OBJECTIVE = {
  id: OBJECTIVE_ID,
  campaign_id: CAMPAIGN_ID,
  is_committed: true,
  contributed: 42,
  last_modified: '2026-07-02T10:00:00Z',
};

const MOCK_CHARACTER_OBJECTIVES: CharacterMilitaryCampaignObjectivesResponse = {
  objectives: [MOCK_CHARACTER_OBJECTIVE],
};

describe('MilitaryCampaignsClient', () => {
  let client: MilitaryCampaignsClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const rateLimiter = new RateLimiter();
    rateLimiter.reset();
    rateLimiter.setTestMode(true);
    const apiClient = new ApiClient(
      'test',
      'https://esi.evetech.net',
      undefined,
    );
    apiClient.setRateLimiter(rateLimiter);
    client = new MilitaryCampaignsClient(apiClient);
  });

  describe('getMilitaryCampaigns', () => {
    it('should fetch all military campaigns', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_CAMPAIGNS));

      const result = await client.getMilitaryCampaigns();

      expect(result.campaigns).toHaveLength(2);
      expect(result.campaigns[0]!.id).toBe(CAMPAIGN_ID);
      expect(result.campaigns[0]!.state).toBe('Active');
      expect(result.campaigns[1]!.state).toBe('Completed');
      expect(result.campaigns[1]!.finished).toBe('2026-06-30T23:59:59Z');
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/military-campaigns',
      );
    });
  });

  describe('getMilitaryCampaign', () => {
    it('should fetch a specific campaign by UUID', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_CAMPAIGN));

      const result = await client.getMilitaryCampaign(CAMPAIGN_ID);

      expect(result.id).toBe(CAMPAIGN_ID);
      expect(result.state).toBe('Active');
      expect(result.progress).toBe(12);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `https://esi.evetech.net/military-campaigns/${CAMPAIGN_ID}`,
      );
    });
  });

  describe('getMilitaryCampaignObjectives', () => {
    it('should fetch objectives for a campaign', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_OBJECTIVES));

      const result = await client.getMilitaryCampaignObjectives(CAMPAIGN_ID);

      expect(result.objectives).toHaveLength(2);
      expect(result.objectives[0]!.id).toBe(OBJECTIVE_ID);
      expect(result.objectives[0]!.participants.total).toBe(150);
      expect(result.objectives[0]!.participants.committed).toBe(80);
      expect(result.objectives[0]!.participants.contributors).toBe(45);
      expect(result.cursor).toEqual({ after: 'next-page' });
      expect(fetchMock.mock.calls[0][0]).toBe(
        `https://esi.evetech.net/military-campaigns/${CAMPAIGN_ID}/objectives`,
      );
    });
  });

  describe('getMilitaryCampaignObjective', () => {
    it('should fetch a specific objective by UUID', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_OBJECTIVE));

      const result = await client.getMilitaryCampaignObjective(
        CAMPAIGN_ID,
        OBJECTIVE_ID,
      );

      expect(result.id).toBe(OBJECTIVE_ID);
      expect(result.state).toBe('Active');
      expect(result.participants.total).toBe(150);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `https://esi.evetech.net/military-campaigns/${CAMPAIGN_ID}/objectives/${OBJECTIVE_ID}`,
      );
    });
  });

  describe('getCharacterMilitaryCampaignObjectives', () => {
    it('should fetch character campaign objectives with auth', async () => {
      const rateLimiter = new RateLimiter();
      rateLimiter.setTestMode(true);
      const authedApiClient = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'my-token',
      );
      authedApiClient.setRateLimiter(rateLimiter);
      const authedClient = new MilitaryCampaignsClient(authedApiClient);

      fetchMock.mockResponseOnce(JSON.stringify(MOCK_CHARACTER_OBJECTIVES));

      const result =
        await authedClient.getCharacterMilitaryCampaignObjectives(12345);

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0]!.id).toBe(OBJECTIVE_ID);
      expect(result.objectives[0]!.is_committed).toBe(true);
      expect(result.objectives[0]!.contributed).toBe(42);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/characters/12345/military-campaigns/objectives',
      );
      const headers = fetchMock.mock.calls[0][1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Authorization']).toBe('Bearer my-token');
    });
  });

  describe('getCharacterMilitaryCampaignObjective', () => {
    it('should fetch a specific character campaign objective with auth', async () => {
      const rateLimiter = new RateLimiter();
      rateLimiter.setTestMode(true);
      const authedApiClient = new ApiClient(
        'test',
        'https://esi.evetech.net',
        'my-token',
      );
      authedApiClient.setRateLimiter(rateLimiter);
      const authedClient = new MilitaryCampaignsClient(authedApiClient);

      fetchMock.mockResponseOnce(JSON.stringify(MOCK_CHARACTER_OBJECTIVE));

      const result = await authedClient.getCharacterMilitaryCampaignObjective(
        12345,
        OBJECTIVE_ID,
      );

      expect(result.id).toBe(OBJECTIVE_ID);
      expect(result.is_committed).toBe(true);
      expect(result.contributed).toBe(42);
      expect(fetchMock.mock.calls[0][0]).toBe(
        `https://esi.evetech.net/characters/12345/military-campaigns/objectives/${OBJECTIVE_ID}`,
      );
      const headers = fetchMock.mock.calls[0][1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Authorization']).toBe('Bearer my-token');
    });
  });

  describeClientErrors('MilitaryCampaignsClient', (apiClient) =>
    new MilitaryCampaignsClient(apiClient).getMilitaryCampaigns(),
  );
});
