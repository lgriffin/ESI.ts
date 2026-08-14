import { MilitaryCampaignsClient } from '../../../src/clients/MilitaryCampaignsClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

const MOCK_CAMPAIGNS = [
  {
    campaign_id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
    state: 'active',
    progress: 0.45,
    start_time: '2026-07-01T00:00:00Z',
  },
  {
    campaign_id: 'd2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7',
    state: 'completed',
    progress: 1.0,
    start_time: '2026-06-01T00:00:00Z',
    finish_time: '2026-06-30T23:59:59Z',
  },
];

const MOCK_CAMPAIGN = {
  campaign_id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  state: 'active',
  progress: 0.45,
  start_time: '2026-07-01T00:00:00Z',
};

const MOCK_OBJECTIVES = [
  {
    objective_id: 'obj-1111-2222-3333-4444',
    campaign_id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
    state: 'active',
    progress: 0.3,
    participants: {
      total: 150,
      committed: 80,
      contributors: 45,
    },
  },
  {
    objective_id: 'obj-5555-6666-7777-8888',
    campaign_id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
    state: 'completed',
    progress: 1.0,
    participants: {
      total: 200,
      committed: 120,
      contributors: 95,
    },
  },
];

const MOCK_OBJECTIVE = {
  objective_id: 'obj-1111-2222-3333-4444',
  campaign_id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  state: 'active',
  progress: 0.3,
  participants: {
    total: 150,
    committed: 80,
    contributors: 45,
  },
};

const MOCK_CHARACTER_OBJECTIVES = [
  {
    objective_id: 'obj-1111-2222-3333-4444',
    campaign_id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
    committed: true,
    contribution: 42,
  },
];

const MOCK_CHARACTER_OBJECTIVE = {
  objective_id: 'obj-1111-2222-3333-4444',
  campaign_id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  committed: true,
  contribution: 42,
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

      expect(result).toHaveLength(2);
      expect(result[0].campaign_id).toBe(
        'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
      );
      expect(result[0].state).toBe('active');
      expect(result[1].state).toBe('completed');
      expect(result[1].finish_time).toBe('2026-06-30T23:59:59Z');
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/military-campaigns',
      );
    });
  });

  describe('getMilitaryCampaign', () => {
    it('should fetch a specific campaign by UUID', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_CAMPAIGN));

      const result = await client.getMilitaryCampaign(
        'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
      );

      expect(result.campaign_id).toBe('c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6');
      expect(result.state).toBe('active');
      expect(result.progress).toBe(0.45);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/military-campaigns/c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
      );
    });
  });

  describe('getMilitaryCampaignObjectives', () => {
    it('should fetch objectives for a campaign', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_OBJECTIVES));

      const result = await client.getMilitaryCampaignObjectives(
        'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
      );

      expect(result).toHaveLength(2);
      expect(result[0].objective_id).toBe('obj-1111-2222-3333-4444');
      expect(result[0].participants.total).toBe(150);
      expect(result[0].participants.committed).toBe(80);
      expect(result[0].participants.contributors).toBe(45);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/military-campaigns/c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6/objectives',
      );
    });
  });

  describe('getMilitaryCampaignObjective', () => {
    it('should fetch a specific objective by UUID', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(MOCK_OBJECTIVE));

      const result = await client.getMilitaryCampaignObjective(
        'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
        'obj-1111-2222-3333-4444',
      );

      expect(result.objective_id).toBe('obj-1111-2222-3333-4444');
      expect(result.state).toBe('active');
      expect(result.participants.total).toBe(150);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/military-campaigns/c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6/objectives/obj-1111-2222-3333-4444',
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

      expect(result).toHaveLength(1);
      expect(result[0].objective_id).toBe('obj-1111-2222-3333-4444');
      expect(result[0].committed).toBe(true);
      expect(result[0].contribution).toBe(42);
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
        'obj-1111-2222-3333-4444',
      );

      expect(result.objective_id).toBe('obj-1111-2222-3333-4444');
      expect(result.committed).toBe(true);
      expect(result.contribution).toBe(42);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://esi.evetech.net/characters/12345/military-campaigns/objectives/obj-1111-2222-3333-4444',
      );
      const headers = fetchMock.mock.calls[0][1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Authorization']).toBe('Bearer my-token');
    });
  });

  describeClientErrors('MilitaryCampaignsClient', () =>
    client.getMilitaryCampaigns(),
  );
});
