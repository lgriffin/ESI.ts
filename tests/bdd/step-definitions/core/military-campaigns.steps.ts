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
  'tests/bdd/features/core/0026-military-campaigns.feature',
);

/**
 * Matches exactly one ESI path. `military-campaigns` would otherwise also
 * match every campaign detail and objective path beneath it.
 */
const esiPath = (path: string) =>
  new RegExp(`^https://esi\\.evetech\\.net/${path}/?(\\?|$)`);

const ACTIVE_CAMPAIGN_ID = 'c1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6';
const COMPLETED_CAMPAIGN_ID = 'd2b3c4d5-e6f7-48b9-80d1-e2f3a4b5c6d7';
const OBJECTIVE_A = '0b1e2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const OBJECTIVE_B = '5f6a7b8c-9d0e-4f1a-9b2c-3d4e5f6a7b8c';

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Active and completed campaigns return state and progress', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('active and completed military campaigns exist', () => {
      queueResponse({
        match: esiPath('military-campaigns'),
        body: {
          campaigns: [
            {
              id: ACTIVE_CAMPAIGN_ID,
              state: 'Active',
              progress: 12,
              started: '2026-07-01T00:00:00Z',
            },
            {
              id: COMPLETED_CAMPAIGN_ID,
              state: 'Completed',
              progress: 30,
              started: '2026-06-01T00:00:00Z',
              finished: '2026-06-30T23:59:59Z',
            },
          ],
        },
      });
    });

    when('the client requests the campaigns listing', async () => {
      result = await client.militaryCampaigns.getMilitaryCampaigns();
    });

    then('the client shall return campaigns with state and progress', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe('/military-campaigns');
      expect(
        result.campaigns.map((c: any) => [
          c.id,
          c.state,
          c.progress,
          c.finished,
        ]),
      ).toEqual([
        [ACTIVE_CAMPAIGN_ID, 'Active', 12, undefined],
        [COMPLETED_CAMPAIGN_ID, 'Completed', 30, '2026-06-30T23:59:59Z'],
      ]);
      expect(result.campaigns[0]).not.toHaveProperty('finished');
    });
  });

  test('Campaign fetched by UUID returns its start time and progress', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a valid campaign UUID', () => {
      queueResponse({
        match: esiPath(`military-campaigns/${ACTIVE_CAMPAIGN_ID}`),
        body: {
          id: ACTIVE_CAMPAIGN_ID,
          state: 'Active',
          progress: 12,
          started: '2026-07-01T00:00:00Z',
        },
      });
    });

    when('the client requests the campaign details', async () => {
      result =
        await client.militaryCampaigns.getMilitaryCampaign(ACTIVE_CAMPAIGN_ID);
    });

    then('the client shall return the full campaign information', () => {
      expect(lastRequest().url.pathname).toBe(
        `/military-campaigns/${ACTIVE_CAMPAIGN_ID}`,
      );
      expect(result).toEqual({
        id: ACTIVE_CAMPAIGN_ID,
        state: 'Active',
        progress: 12,
        started: '2026-07-01T00:00:00Z',
      });
    });
  });

  test('Two objectives return their participant totals and commitments', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('a campaign with objectives', () => {
      queueResponse({
        match: esiPath(`military-campaigns/${ACTIVE_CAMPAIGN_ID}/objectives`),
        body: {
          objectives: [
            {
              id: OBJECTIVE_A,
              state: 'Active',
              progress: 3,
              last_modified: '2026-07-02T10:00:00Z',
              participants: { total: 150, committed: 80, contributors: 45 },
            },
            {
              id: OBJECTIVE_B,
              state: 'Completed',
              progress: 10,
              last_modified: '2026-07-03T10:00:00Z',
              participants: { total: 200, committed: 120, contributors: 95 },
            },
          ],
        },
      });
    });

    when('the client requests the campaign objectives', async () => {
      result =
        await client.militaryCampaigns.getMilitaryCampaignObjectives(
          ACTIVE_CAMPAIGN_ID,
        );
    });

    then('the client shall return objectives with participant counts', () => {
      expect(lastRequest().url.pathname).toBe(
        `/military-campaigns/${ACTIVE_CAMPAIGN_ID}/objectives`,
      );
      expect(
        result.objectives.map((o: any) => [
          o.id,
          o.state,
          o.progress,
          o.participants.total,
          o.participants.committed,
          o.participants.contributors,
        ]),
      ).toEqual([
        [OBJECTIVE_A, 'Active', 3, 150, 80, 45],
        [OBJECTIVE_B, 'Completed', 10, 200, 120, 95],
      ]);
    });
  });

  test('Character objective returns the commitment flag and contribution', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const characterId = 1689391488;

    given('an authenticated character with campaign participation', () => {
      queueResponse({
        match: esiPath(
          `characters/${characterId}/military-campaigns/objectives`,
        ),
        body: {
          objectives: [
            {
              id: OBJECTIVE_A,
              campaign_id: ACTIVE_CAMPAIGN_ID,
              is_committed: true,
              contributed: 42,
              last_modified: '2026-07-02T10:00:00Z',
            },
            {
              id: OBJECTIVE_B,
              campaign_id: ACTIVE_CAMPAIGN_ID,
              is_committed: false,
              contributed: 0,
              last_modified: '2026-07-03T10:00:00Z',
            },
          ],
        },
      });
    });

    when('the client requests their campaign objectives', async () => {
      result =
        await client.militaryCampaigns.getCharacterMilitaryCampaignObjectives(
          characterId,
        );
    });

    then('the client shall return the character participation data', () => {
      const request = lastRequest();
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/military-campaigns/objectives`,
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(
        result.objectives.map((o: any) => [
          o.id,
          o.is_committed,
          o.contributed,
        ]),
      ).toEqual([
        [OBJECTIVE_A, true, 42],
        [OBJECTIVE_B, false, 0],
      ]);
    });
  });

  test('Unknown campaign UUID is rejected with 404', ({
    given,
    when,
    then,
  }) => {
    const unknownCampaignId = '00000000-0000-4000-8000-000000000000';
    let caughtError: any;

    given('an invalid campaign UUID', () => {
      queueError(404, 'Campaign not found', {
        match: esiPath(`military-campaigns/${unknownCampaignId}`),
      });
    });

    when('the client requests details for the invalid campaign', async () => {
      try {
        await client.militaryCampaigns.getMilitaryCampaign(unknownCampaignId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 404 error for the campaign', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toBe(
        `/military-campaigns/${unknownCampaignId}`,
      );
    });
  });

  test('No campaigns in progress returns an empty array', ({
    given,
    when,
    then,
  }) => {
    let result: any;

    given('no military campaigns exist', () => {
      queueResponse({
        match: esiPath('military-campaigns'),
        body: { campaigns: [] },
      });
    });

    when('the client requests the empty campaigns listing', async () => {
      result = await client.militaryCampaigns.getMilitaryCampaigns();
    });

    then('the client shall return an empty campaigns array', () => {
      expect(lastRequest().url.pathname).toBe('/military-campaigns');
      expect(result).toEqual({ campaigns: [] });
    });
  });

  test("Next page of a campaign's objectives is requested with the after cursor", ({
    given,
    when,
    then,
  }) => {
    given('a campaign whose objectives continue on a later page', () => {
      queueResponse({
        match: esiPath(`military-campaigns/${ACTIVE_CAMPAIGN_ID}/objectives`),
        body: { objectives: [], cursor: { before: 'page-2-before' } },
      });
    });

    when(
      'the client requests the objectives after that cursor with a limit of 50',
      async () => {
        await client.militaryCampaigns.getMilitaryCampaignObjectives(
          ACTIVE_CAMPAIGN_ID,
          'page-1-after',
          undefined,
          50,
        );
      },
    );

    then('the request shall carry the after cursor and the limit', () => {
      const { url } = lastRequest();
      expect(url.pathname).toBe(
        `/military-campaigns/${ACTIVE_CAMPAIGN_ID}/objectives`,
      );
      expect(url.searchParams.get('after')).toBe('page-1-after');
      expect(url.searchParams.get('limit')).toBe('50');
      expect(url.searchParams.has('before')).toBe(false);
    });
  });

  test("Earlier page of a character's objectives is requested with the before cursor", ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;

    given('a character whose objectives continue on an earlier page', () => {
      queueResponse({
        match: esiPath(
          `characters/${characterId}/military-campaigns/objectives`,
        ),
        body: { objectives: [] },
      });
    });

    when(
      'the client requests the character objectives before that cursor',
      async () => {
        await client.militaryCampaigns.getCharacterMilitaryCampaignObjectives(
          characterId,
          undefined,
          'page-3-before',
        );
      },
    );

    then('the request shall carry the before cursor', () => {
      const { url } = lastRequest();
      expect(url.searchParams.get('before')).toBe('page-3-before');
      expect(url.searchParams.has('after')).toBe(false);
      expect(url.searchParams.has('limit')).toBe(false);
    });
  });
});
