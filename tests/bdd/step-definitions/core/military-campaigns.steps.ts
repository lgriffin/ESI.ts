import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature(
  'tests/bdd/features/core/0026-military-campaigns.feature',
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

  test('WHEN listing military campaigns, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('active and completed military campaigns exist', () => {
      const mockCampaigns = [
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

      jest
        .spyOn(client.militaryCampaigns, 'getMilitaryCampaigns')
        .mockResolvedValue(mockCampaigns);
    });

    when('the client requests the campaigns listing', async () => {
      result = await client.militaryCampaigns.getMilitaryCampaigns();
    });

    then('the client shall return campaigns with state and progress', () => {
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty(
        'campaign_id',
        'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
      );
      expect(result[0]).toHaveProperty('state', 'active');
      expect(result[0]).toHaveProperty('progress');
      expect(result[1]).toHaveProperty('state', 'completed');
      expect(result[1]).toHaveProperty('finish_time');
    });
  });

  test('WHEN getting a specific campaign by UUID, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const campaignId = 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6';

    given('a valid campaign UUID', () => {
      const mockCampaign = {
        campaign_id: campaignId,
        state: 'active',
        progress: 0.45,
        start_time: '2026-07-01T00:00:00Z',
      };

      jest
        .spyOn(client.militaryCampaigns, 'getMilitaryCampaign')
        .mockResolvedValue(mockCampaign);
    });

    when('the client requests the campaign details', async () => {
      result = await client.militaryCampaigns.getMilitaryCampaign(campaignId);
    });

    then('the client shall return the full campaign information', () => {
      expect(result).toBeDefined();
      expect(result.campaign_id).toBe(campaignId);
      expect(result.state).toBe('active');
      expect(result.progress).toBe(0.45);
      expect(result.start_time).toBe('2026-07-01T00:00:00Z');
    });
  });

  test('WHEN getting objectives for a campaign, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const campaignId = 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6';

    given('a campaign with objectives', () => {
      const mockObjectives = [
        {
          objective_id: 'obj-1111-2222-3333-4444',
          campaign_id: campaignId,
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
          campaign_id: campaignId,
          state: 'completed',
          progress: 1.0,
          participants: {
            total: 200,
            committed: 120,
            contributors: 95,
          },
        },
      ];

      jest
        .spyOn(client.militaryCampaigns, 'getMilitaryCampaignObjectives')
        .mockResolvedValue(mockObjectives);
    });

    when('the client requests the campaign objectives', async () => {
      result =
        await client.militaryCampaigns.getMilitaryCampaignObjectives(
          campaignId,
        );
    });

    then('the client shall return objectives with participant counts', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].objective_id).toBe('obj-1111-2222-3333-4444');
      expect(result[0].participants.total).toBe(150);
      expect(result[0].participants.committed).toBe(80);
      expect(result[0].participants.contributors).toBe(45);
      expect(result[1].state).toBe('completed');
    });
  });

  test('WHEN getting character campaign participation, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character with campaign participation', () => {
      const mockCharacterObjectives = [
        {
          objective_id: 'obj-1111-2222-3333-4444',
          campaign_id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
          committed: true,
          contribution: 42,
        },
      ];

      jest
        .spyOn(
          client.militaryCampaigns,
          'getCharacterMilitaryCampaignObjectives',
        )
        .mockResolvedValue(mockCharacterObjectives);
    });

    when('the client requests their campaign objectives', async () => {
      result =
        await client.militaryCampaigns.getCharacterMilitaryCampaignObjectives(
          characterId,
        );
    });

    then('the client shall return the character participation data', () => {
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].objective_id).toBe('obj-1111-2222-3333-4444');
      expect(result[0].committed).toBe(true);
      expect(result[0].contribution).toBe(42);
    });
  });

  test('IF requesting a non-existent campaign, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const invalidCampaignId = 'nonexistent-campaign-uuid';
    let caughtError: any;

    given('an invalid campaign UUID', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest
        .spyOn(client.militaryCampaigns, 'getMilitaryCampaign')
        .mockRejectedValue(notFoundError);
    });

    when('the client requests details for the invalid campaign', async () => {
      try {
        await client.militaryCampaigns.getMilitaryCampaign(invalidCampaignId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 404 error for the campaign', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });

  test('WHILE no military campaigns are active, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('no military campaigns exist', () => {
      jest
        .spyOn(client.militaryCampaigns, 'getMilitaryCampaigns')
        .mockResolvedValue([]);
    });

    when('the client requests the empty campaigns listing', async () => {
      result = await client.militaryCampaigns.getMilitaryCampaigns();
    });

    then('the client shall return an empty campaigns array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });
});
